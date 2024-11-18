const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config;

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Schema
const transactionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  sold: Boolean,
  dateOfSale: { type: Date },
  image: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Transaction API. Use /api/initialize-database to set up the database.');
});

// Initialize Database
app.get('localhost:3001/api/initialize-database', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    await Transaction.deleteMany({}); // Clear existing data
    await Transaction.insertMany(transactions);
    
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List Transactions with Search and Pagination
app.get('localhost:3001/api/transactions', async (req, res) => {
  try {
    const { month, search = '', page = 1, perPage = 10 } = req.query;
    const skip = (page - 1) * perPage;

    // Create date filter for selected month
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
    
    let query = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber]
      }
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: isNaN(search) ? undefined : Number(search) }
      ].filter(condition => condition !== undefined);
    }

    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(Number(perPage));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics API
app.get('/api/statistics', async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;

    const monthFilter = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber]
      }
    };

    const [totalSale, soldItems, notSoldItems] = await Promise.all([
      Transaction.aggregate([
        { $match: monthFilter },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]),
      Transaction.countDocuments({ ...monthFilter, sold: true }),
      Transaction.countDocuments({ ...monthFilter, sold: false })
    ]);

    res.json({
      totalSale: totalSale[0]?.total || 0,
      soldItems,
      notSoldItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bar Chart API
app.get('/api/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;

    const ranges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity }
    ];

    const result = await Promise.all(
      ranges.map(async ({ min, max }) => {
        const count = await Transaction.countDocuments({
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthNumber]
          },
          price: { $gte: min, $lt: max === Infinity ? 1000000 : max }
        });
        return {
          range: `${min}-${max === Infinity ? 'above' : max}`,
          count
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pie Chart API
app.get('/api/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;

    const result = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthNumber]
          }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(result.map(item => ({
      category: item._id,
      count: item.count
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Combined API
app.get('/api/combined-data', async (req, res) => {
  try {
    const { month } = req.query;
    
    const [statistics, barChart, pieChart] = await Promise.all([
      axios.get(`http://localhost:3001/api/statistics?month=${month}`),
      axios.get(`http://localhost:3001/api/bar-chart?month=${month}`),
      axios.get(`http://localhost:3001/api/pie-chart?month=${month}`)
    ]);

    res.json({
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
mongoose.connect(mongoURI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));