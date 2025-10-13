import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler } from 'chart.js';
import './analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler);

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

const SummaryCard = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-xl shadow-lg flex items-center justify-between ${color} text-white`}>
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
                const currentYear = new Date().getFullYear();

                const [bookingsRes, revenueRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/summary/total-bookings-month?year=${currentYear}`),
                    axios.get(`${API_BASE_URL}/summary/total-revenue-month?year=${currentYear}`),
                ]);

                setSummary({
                    totalBookingsMonth: bookingsRes.data.total_bookings || 0,
                    totalRevenueMonth: revenueRes.data.total_revenue || 0,
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
    const currentMonthDisplay = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SummaryCard title="Loading..." value="---" icon="⏳" color="bg-gray-400" />
            <SummaryCard title="Loading..." value="---" icon="⏳" color="bg-gray-400" />
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SummaryCard
                title={`Total Bookings (${currentMonthDisplay})`}
                value={bookingsValue}
                icon="🛏️"
                color="bg-purple-600"
            />
            <SummaryCard
                title={`Total Revenue (${currentMonthDisplay})`}
                value={revenueValue}
                icon="💰"
                color="bg-green-600"
            />
        </div>
    );
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
                
                if (!Array.isArray(data) || data.length === 0) {
                    setLoading(false);
                    return;
                }

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
    if (chartData.labels.length === 0) return <div className="text-center p-4 text-gray-500">No booking data available yet.</div>;


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

                if (!Array.isArray(data) || data.length === 0) {
                    setLoading(false);
                    return;
                }

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
    if (chartData.labels.length === 0) return <div className="text-center p-4 text-gray-500">No service booking data available yet.</div>;


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

const MonthlyBookingCountTrendChart = () => {
    const [chartData, setChartData] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Total Bookings',
            data: Array(12).fill(0),
            fill: true,
            backgroundColor: 'rgba(102, 51, 153, 0.2)',
            borderColor: 'rgba(102, 51, 153, 1)',
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(102, 51, 153, 1)',
            pointBorderColor: '#fff',
            pointHoverRadius: 7,
        }],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnnualBookingCountData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/bookings-by-month`);
                const data = response.data;

                if (!Array.isArray(data) || data.length === 0) {
                    setLoading(false);
                    return;
                }

                const bookingCountsPerMonth = Array(12).fill(0);
                data.forEach(item => {
                    const currentYear = new Date().getFullYear();
                    if (item.booking_year === currentYear) {
                        bookingCountsPerMonth[item.booking_month - 1] = item.total_bookings;
                    }
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
    if (chartData.datasets[0].data.every(d => d === 0)) return <div className="text-center p-4 text-gray-500">No booking count data available for this year.</div>;

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
                        return `Bookings: ${context.parsed.y}`;
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Booking Count Trend ({new Date().getFullYear()})</h2>
            <div className="flex-grow h-96">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

const AnalyticsDashboard = () => {
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Em'z Analytics Dashboard 📊</h1>
                <p className="text-gray-600">Overview of booking and revenue performance.</p>
            </div>

            <AnalyticsSummary />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="lg:col-span-1">
                    <MonthlyBookingsChart />
                </div>
                <div className="lg:col-span-1">
                    <ServiceBookingsChart />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6">
                <div className="col-span-1">
                    <MonthlyBookingCountTrendChart />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
