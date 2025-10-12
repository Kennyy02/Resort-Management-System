import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler } from 'chart.js';
import './analytics.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler);

// CRITICAL FIX: Use the REACT_APP_ANALYTICS_API environment variable
const API_BASE_URL = `${process.env.REACT_APP_ANALYTICS_API}/api/analytics`; 

const formatCurrencyPHP = (value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue === 0) {
        return '₱0.00';
    }
    return new Intl.NumberFormat('en-PH', { 
        style: 'currency', 
        currency: 'PHP',
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    }).format(numericValue);
};

// =========================================================================
// Summary Card Components
// =========================================================================
const SummaryCard = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-xl shadow-lg flex items-center justify-between ${color}`}>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
        <div className="text-3xl opacity-70">
            {icon}
        </div>
    </div>
);

const AnalyticsSummary = () => {
    const [summary, setSummary] = useState({
        totalBookingsMonth: 0,
        totalRevenueMonth: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummaryData = async () => {
            setLoading(true);
            try {
                // Fetching summary data using the environment variable base URL
                const [bookingsRes, revenueRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/summary/total-bookings-month`),
                    axios.get(`${API_BASE_URL}/summary/total-revenue-month`),
                ]);

                setSummary({
                    totalBookingsMonth: bookingsRes.data.total_bookings,
                    totalRevenueMonth: revenueRes.data.total_revenue,
                });
            } catch (err) {
                console.error("Error fetching summary data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummaryData();
    }, []);

    const revenueValue = formatCurrencyPHP(summary.totalRevenueMonth);
    const bookingsValue = summary.totalBookingsMonth;
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SummaryCard title="Loading..." value="---" icon="..." color="bg-gray-200 text-gray-700" />
            <SummaryCard title="Loading..." value="---" icon="..." color="bg-gray-200 text-gray-700" />
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SummaryCard
                title={`Total Bookings (${currentMonth})`}
                value={bookingsValue}
                icon="🛏️"
                color="bg-purple-600 text-white"
            />
            <SummaryCard
                title={`Total Revenue (${currentMonth})`}
                value={revenueValue}
                icon="💰"
                color="bg-green-600 text-white"
            />
        </div>
    );
};

// =========================================================================
// Monthly Bookings Chart
// =========================================================================
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
            title: { display: false },
            legend: { display: false },
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
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: function(value) {
                        return value >= 1000 ? (value / 1000) + 'K' : value;
                    },
                    color: '#6c757d',
                },
                title: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6c757d' },
                title: { display: false },
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
            <div className="flex-grow h-72">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

// =========================================================================
// Bookings by Service Chart
// =========================================================================
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
            title: { display: false },
            legend: { display: false },
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
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: function(value) {
                        return value >= 1000 ? (value / 1000) + 'K' : value;
                    },
                    color: '#6c757d',
                },
                title: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6c757d' },
                title: { display: false },
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
            <div className="flex-grow h-72">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};


// =========================================================================
// Monthly Revenue Trend Chart
// =========================================================================
const MonthlyRevenueTrendChart = () => {
    const [chartData, setChartData] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Total Revenue',
            data: Array(12).fill(0),
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointBorderColor: '#fff',
            pointHoverRadius: 7,
        }],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchAnnualRevenueData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/revenue-by-month`);
                const data = response.data;

                const revenuePerMonth = Array(12).fill(0);
                
                const currentYearData = data.filter(item => item.revenue_year === currentYear);
                
                currentYearData.forEach(item => {
                    revenuePerMonth[item.revenue_month - 1] = item.total_revenue;
                });

                setChartData(prev => ({
                    ...prev,
                    datasets: [{
                        ...prev.datasets[0],
                        data: revenuePerMonth,
                    }],
                }));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching annual revenue data:", err);
                setError("Failed to load annual revenue data.");
                setLoading(false);
            }
        };
        fetchAnnualRevenueData();
    }, [currentYear]);

    if (loading) return <div className="text-center p-4">Loading annual revenue data...</div>;
    if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: false },
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.7)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                cornerRadius: 5,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        return `Revenue: ${formatCurrencyPHP(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: function(value) {
                        return formatCurrencyPHP(value).replace('₱', '').replace('.00', '');
                    },
                    color: '#6c757d',
                },
                title: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6c757d' },
                title: { display: false },
            },
        },
    };

    return (
        <div className="chart-card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Revenue Trend ({currentYear})</h2>
            <div className="flex-grow h-96">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

// =========================================================================
// Main Dashboard Component
// =========================================================================

const AnalyticsDashboard = () => {
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Top Greeting Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Em'z Analytics Dashboard 📊</h1>
                <p className="text-gray-600">Overview of booking and revenue performance.</p>
            </div>

            {/* Top Row: Summary Cards */}
            <AnalyticsSummary />

            {/* Middle Row: Monthly Booking Trends and Service Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="lg:col-span-1">
                    <MonthlyBookingsChart />
                </div>
                <div className="lg:col-span-1">
                    <ServiceBookingsChart />
                </div>
            </div>

            {/* Bottom Row: Monthly Revenue Trend Chart */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                <div className="col-span-1">
                    <MonthlyRevenueTrendChart />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
