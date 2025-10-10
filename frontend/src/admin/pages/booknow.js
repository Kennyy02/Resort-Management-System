import React, { useEffect, useState } from "react";
import "./styles/booknow.css";

const AdminBookNow = () => {
  const [bookings, setBookings] = useState([]);

  // --- Fetch all bookings ---
  useEffect(() => {
    fetch("https://booking-production-5576.up.railway.app/api/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch((err) => console.error("Error fetching bookings:", err));
  }, []);

  // --- Update booking status ---
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`https://booking-production-5576.up.railway.app/api/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update booking status");

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (error) {
      console.error("❌ Error updating status:", error);
      alert("Failed to update status. Please ensure the backend is accessible at https://booking-production-5576.up.railway.app");
    }
  };

  return (
    <div className="admin-bookings">
      <h2>Manage Bookings</h2>
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Service</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Mode of Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.name}</td>
              <td>{b.serviceName}</td>
              <td>{b.checkInDate}</td>
              <td>{b.checkOutDate}</td>
              <td>{b.modeOfPayment}</td>
              <td>
                <select value={b.status} onChange={(e) => handleStatusChange(b.id, e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBookNow;
