import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement } from 'chart.js';
import { Filler } from 'chart.js';
import './analytics.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler);

const API_BASE_URL = `${process.env.REACT_APP_ANALYTICS_API}/api/analytics`;

const formatCurrencyPHP = (value) => {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return '₱0.00';
  }
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(numericValue);
};

const MonthlyBookingsChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Total Bookings',
      data: [],
      backgroundColor: 'rgba(102, 51, 153, 0.8)',
      borderColor: 'rgba(102, 51, 153, 1)',
      borderWidth: 1,
      borderRadius: 5,
    }],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bookings-by-month`);
        const data = response.data;

        const labels = data.map(item => `${item.booking_month}/${item.booking_year}`);
        const bookingCounts = data.map(item => item.total_bookings);

        setChartData({
          labels: labels,
          datasets: [{
            ...chartData.datasets[0],
            data: bookingCounts,
          }],
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching monthly booking data:", err);
        setError("Failed to load booking data.");
        setLoading(false);
      }
    };

    fetchBookingData();
  }, []);

  if (loading) return <div className="text-center p-4">Loading monthly booking data...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        cornerRadius: 5,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          callback: function(value) {
            return value >= 1000 ? (value / 1000) + 'K' : value;
          },
          color: '#6c757d',
        },
        title: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6c757d',
        },
        title: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="chart-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Monthly Booking Trends</h2>
        <select className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-purple-500 focus:border-purple-500">
          <option>Last 6 months</option>
          <option>Last 12 months</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="flex-grow">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

const ServiceBookingsChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Bookings',
      data: [],
      backgroundColor: 'rgba(102, 51, 153, 0.8)',
      borderColor: 'rgba(102, 51, 153, 1)',
      borderWidth: 1,
      borderRadius: 5,
    }],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bookings-by-service`);
        const data = response.data;

        const labels = data.map(item => item.serviceName);
        const bookingCounts = data.map(item => item.total_bookings);

        setChartData({
          labels: labels,
          datasets: [{
            ...chartData.datasets[0],
            data: bookingCounts,
          }],
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings by service type:", err);
        setError("Failed to load service bookings data.");
        setLoading(false);
      }
    };

    fetchServiceData();
  }, []);

  if (loading) return <div className="text-center p-4">Loading service bookings data...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        cornerRadius: 5,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          callback: function(value) {
            return value >= 1000 ? (value / 1000) + 'K' : value;
          },
          color: '#6c757d',
        },
        title: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6c757d',
        },
        title: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="chart-card">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Bookings by Service Type</h2>
      <div className="flex justify-between items-center mb-4">
        <select className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-purple-500 focus:border-purple-500">
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Annually</option>
        </select>
      </div>
      <div className="flex-grow">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

const MonthlyBookingCountTrendChart = () => {
    const [chartData, setChartData] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Total Bookings',
            data: [],
            fill: true,
            backgroundColor: 'rgba(102, 51, 153, 0.2)',
            borderColor: 'rgba(102, 51, 153, 1)',
            tension: 0.4,
            pointRadius: 0,
            pointHitRadius: 10,
        }],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnnualBookingCountData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/bookings-by-month`);
                const data = response.data;

                const bookingCountsPerMonth = Array(12).fill(0);
                data.forEach(item => {
                    bookingCountsPerMonth[item.booking_month - 1] = item.total_bookings;
                });

                setChartData(prev => ({
                    ...prev,
                    datasets: [{
                        ...prev.datasets[0],
                        data: bookingCountsPerMonth,
                    }],
                }));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching annual booking count data:", err);
                setError("Failed to load annual booking count data.");
                setLoading(false);
            }
        };
        fetchAnnualBookingCountData();
    }, []);

    if (loading) return <div className="text-center p-4">Loading annual booking count data...</div>;
    if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: false,
            },
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.7)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                cornerRadius: 5,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return `Bookings: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                },
                ticks: {
                    callback: function(value) {
                        return value >= 1000 ? (value / 1000) + 'K' : value;
                    },
                    color: '#6c757d',
                },
                title: {
                    display: false,
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6c757d',
                },
                title: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="chart-card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Booking Count Trend</h2>
            <div className="flex-grow">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};


const AnalyticsDashboard = () => {
    return (
        <div className="p-6 bg-gray-100">
            {/* Top Greeting Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Em'z Analytics!</h1>
            </div>

            {/* Main Charts Section - Two above, one below */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Row: Monthly Booking Trends */}
                <div className="lg:col-span-1">
                    <MonthlyBookingsChart />
                </div>

                {/* Top Row: Bookings by Service Type */}
                <div className="lg:col-span-1">
                    <ServiceBookingsChart />
                </div>
            </div>

            {/* Bottom Row: Monthly Booking Count Trend Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"> {/* Added mt-6 for spacing */}
                <div className="lg:col-span-2"> {/* Spans both columns */}
                    <MonthlyBookingCountTrendChart />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
