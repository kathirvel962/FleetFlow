import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", formData);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>FleetFlow Login</h1>

            {error && <p>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <br />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Password</label>
                    <br />
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        required
                    />
                </div>

                <br />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}

export default Login;