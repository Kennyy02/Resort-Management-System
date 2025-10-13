import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler } from 'chart.js';
import './analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, BarElement, Filler);

const API_BASE_URL = `${process.env.REACT_APP_ANALYTICS_API}/api/analytics`;

// Define sage green colors to match the CSS variables for consistency
const SAGE_GREEN_PRIMARY = 'rgba(143, 188, 143, 1)'; // #8fbc8f
const SAGE_GREEN_BAR_FILL = 'rgba(143, 188, 143, 0.8)';
const SAGE_GREEN_LINE_FILL = 'rgba(143, 188, 143, 0.2)';

const MonthlyBookingsChart = () => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            label: 'Total Bookings',
            data: [],
            backgroundColor: SAGE_GREEN_BAR_FILL, // Updated to Sage Green
            borderColor: SAGE_GREEN_PRIMARY, // Updated to Sage Green
            borderWidth: 1,
            borderRadius: 5,
        }],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        const fetchBookingData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/bookings-by-month`);
                const data = response.data;

                if (!Array.isArray(data) || data.length === 0) {
                    setLoading(false);
                    return;
                }

                const labels = data.map(item => `${monthNames[item.booking_month - 1]} ${item.booking_year}`);
                const bookingCounts = data.map(item => item.total_bookings);

                setChartData(prev => ({
                    labels: labels,
                    datasets: [{
                        ...prev.datasets[0],
                        data: bookingCounts,
                    }],
                }));
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
    if (chartData.datasets[0].data.length === 0) return <div className="text-center p-4 text-gray-500">No booking data available yet.</div>;


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
            backgroundColor: SAGE_GREEN_BAR_FILL, // Updated to Sage Green
            borderColor: SAGE_GREEN_PRIMARY, // Updated to Sage Green
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

                setChartData(prev => ({
                    labels: labels,
                    datasets: [{
                        ...prev.datasets[0],
                        data: bookingCounts,
                    }],
                }));
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
    const currentYear = new Date().getFullYear();
    const [chartData, setChartData] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Total Bookings',
            data: Array(12).fill(0),
            fill: true,
            backgroundColor: SAGE_GREEN_LINE_FILL, // Updated to Sage Green
            borderColor: SAGE_GREEN_PRIMARY, // Updated to Sage Green
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: SAGE_GREEN_PRIMARY, // Updated to Sage Green
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
    if (chartData.datasets[0].data.every(d => d === 0)) return <div className="text-center p-4 text-gray-500">No booking count data available for {currentYear}.</div>;

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
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Booking Count Trend ({currentYear})</h2>
            <div className="flex-grow h-96">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

const AnalyticsDashboard = () => {
    return (
        <div className="p-6 bg-gray-100">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Em'z Analytics!</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <MonthlyBookingsChart />
                </div>

                <div className="lg:col-span-1">
                    <ServiceBookingsChart />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <MonthlyBookingCountTrendChart />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
