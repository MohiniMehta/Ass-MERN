import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const TransactionDashboard = () => {
  const [month, setMonth] = useState('March');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchData();
  }, [month, search, page]);

  const fetchData = async () => {
    try {
      // Fetch transactions
      const transResponse = await fetch(
        `http://localhost:3001/api/transactions?month=${month}&search=${search}&page=${page}`
      );
      const transData = await transResponse.json();
      setTransactions(transData.transactions);
      setTotalPages(transData.totalPages);

      // Fetch combined data
      const combinedResponse = await fetch(
        `http://localhost:3001/api/combined-data?month=${month}`
      );
      const combinedData = await combinedResponse.json();
      setStatistics(combinedData.statistics);
      setBarChartData(combinedData.barChart);
      setPieChartData(combinedData.pieChart);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Transaction Dashboard</h1>
      
      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search transaction"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="p-2 border rounded"
        >
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Statistics - {month}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-100 rounded">
            <p className="font-semibold">Total Sale</p>
            <p>${statistics.totalSale?.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-green-100 rounded">
            <p className="font-semibold">Total Sold Items</p>
            <p>{statistics.soldItems}</p>
          </div>
          <div className="p-4 bg-red-100 rounded">
            <p className="font-semibold">Total Not Sold Items</p>
            <p>{statistics.notSoldItems}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
        <table className="w-full" border={1}>
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">ID</th>
              <th className="p-2">Title</th>
              <th className="p-2">Description</th>
              <th className="p-2">Price</th>
              <th className="p-2">Category</th>
              <th className="p-2">Sold</th>
              <th className="p-2">Image</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className="border-t">
                <td className="p-2">{transaction.id}</td>
                <td className="p-2">{transaction.title}</td>
                <td className="p-2">{transaction.description}</td>
                <td className="p-2">${transaction.price}</td>
                <td className="p-2">{transaction.category}</td>
                <td className="p-2">{transaction.sold ? 'Yes' : 'No'}</td>
                <td className="p-2">
                  <img 
                  src={transaction.image}
                    // src={`/api/placeholder/50/50`} 
                    alt="Product" 
                    className="w-12 h-12 object-cover"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Price Range Distribution</h2>
          <BarChart width={500} height={300} data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Categories Distribution</h2>
          <PieChart width={500} height={300}>
            <Pie
              data={pieChartData}
              cx={250}
              cy={150}
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/*Footer*/}
      <div class="text-center py-4 bg-gray-100 text-lg font-sans text-gray-700 border-t border-gray-300">
        Made By Mohini Mehta

      </div>
    </div>
  );
};

export default TransactionDashboard;