import { useState, useEffect } from "react";
import API from "../../utils/api";
import Layout from "../../components/Layout";
import {
  MdBusiness, MdPhone, MdEmail, MdLocationOn,
  MdLanguage, MdAttachMoney, MdEdit, MdSave,
  MdCancel, MdDelete
} from "react-icons/md";

export default function BusinessProfile() {
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({
    name: "", type: "generic", address: "",
    currency: "PKR", tax_rate: 0, phone: "", email: "", website: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/business/").then((res) => {
      if (res.data.length > 0) {
        setBusiness(res.data[0]);
        setForm(res.data[0]);
      } else {
        setEditMode(true);
      }
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (business) {
        await API.put(`/business/${business.id}/`, form);
      } else {
        const res = await API.post("/business/", form);
        setBusiness(res.data);
      }
      setMessage("Business profile saved successfully!");
      setMessageType("success");
      setEditMode(false);
    } catch {
      setMessage("Error saving profile. Please try again.");
      setMessageType("error");
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCancel = () => {
    if (business) setForm(business);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this business profile?")) return;
    try {
      await API.delete(`/business/${business.id}/`);
      setBusiness(null);
      setForm({ name: "", type: "generic", address: "", currency: "PKR", tax_rate: 0, phone: "", email: "", website: "" });
      setEditMode(true);
      setMessage("Business profile deleted successfully!");
      setMessageType("success");
    } catch {
      setMessage("Error deleting profile. Please try again.");
      setMessageType("error");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const Field = ({ value, icon }) => (
    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <MdBusiness size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Business Profile</h1>
              <p className="text-gray-500 text-sm">Manage your business information</p>
            </div>
          </div>

          {/* Buttons */}
          {!editMode ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleDelete}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-100 transition font-medium">
                <MdDelete size={18} /> Delete
              </button>
              <button onClick={() => setEditMode(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium">
                <MdEdit size={18} /> Edit Profile
              </button>
            </div>
          ) : (
            <button onClick={handleCancel}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium w-full sm:w-auto">
              <MdCancel size={18} /> Cancel
            </button>
          )}
        </div>

        {/* ── Alert Message ── */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            messageType === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            <span>{messageType === "success" ? "✅" : "❌"}</span>
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">Basic Information</h2>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              {editMode ? (
                <div className="relative">
                  <MdBusiness className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input name="name" value={form.name} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Awesome Business" />
                </div>
              ) : (
                <Field value={form.name} icon={<MdBusiness size={18} />} />
              )}
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              {editMode ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {["retail", "restaurant", "pharmacy", "salon", "generic"].map((type) => (
                    <button key={type} onClick={() => setForm({ ...form, type })}
                      className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition ${
                        form.type === type
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              ) : (
                <Field value={form.type} icon={<MdBusiness size={18} />} />
              )}
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {editMode ? (
                  <div className="relative">
                    <MdPhone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+92 300 1234567" />
                  </div>
                ) : (
                  <Field value={form.phone} icon={<MdPhone size={18} />} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {editMode ? (
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input name="email" value={form.email} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="business@email.com" />
                  </div>
                ) : (
                  <Field value={form.email} icon={<MdEmail size={18} />} />
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              {editMode ? (
                <div className="relative">
                  <MdLocationOn className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea name="address" value={form.address} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3} placeholder="Business address..." />
                </div>
              ) : (
                <Field value={form.address} icon={<MdLocationOn size={18} />} />
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              {editMode ? (
                <div className="relative">
                  <MdLanguage className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input name="website" value={form.website} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://mybusiness.com" />
                </div>
              ) : (
                <Field value={form.website} icon={<MdLanguage size={18} />} />
              )}
            </div>
          </div>

          {/* Right Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">Financial Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                {editMode ? (
                  <div className="relative">
                    <MdAttachMoney className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select name="currency" value={form.currency} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      <option value="PKR">🇵🇰 PKR</option>
                      <option value="USD">🇺🇸 USD</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="GBP">🇬🇧 GBP</option>
                      <option value="AED">🇦🇪 AED</option>
                    </select>
                  </div>
                ) : (
                  <Field value={form.currency} icon={<MdAttachMoney size={18} />} />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                {editMode ? (
                  <input name="tax_rate" type="number" value={form.tax_rate} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0" min="0" max="100" />
                ) : (
                  <Field value={`${form.tax_rate}%`} icon={<MdAttachMoney size={18} />} />
                )}
                <p className="text-xs text-gray-400 mt-1">Applied to all POS transactions</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-3">Current Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize text-gray-800">{form.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium text-gray-800">{form.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Rate:</span>
                  <span className="font-medium text-gray-800">{form.tax_rate}%</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {editMode && (
              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2 shadow-sm">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <><MdSave size={18} /> Save Business Profile</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}