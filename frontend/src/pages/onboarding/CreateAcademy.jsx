import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { academyApi } from "../../api/academyApi.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

const CreateAcademy = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    academyName: "",
    martialArts: "Taekwondo",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await academyApi.createAcademy({
        ...form,
        martialArts: form.martialArts
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Academy creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Create Academy Profile</h1>
          <p className="muted">
            Add your academy details to complete onboarding.
          </p>
        </div>
      </div>

      <form className="card form wide-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <Input
          label="Academy Name"
          name="academyName"
          value={form.academyName}
          onChange={handleChange}
          placeholder="Khiladi Martial Arts Academy"
          required
        />

        <Input
          label="Martial Arts"
          name="martialArts"
          value={form.martialArts}
          onChange={handleChange}
          placeholder="Taekwondo, Karate"
          required
        />

        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="9876543210"
        />

        <Input
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="academy@example.com"
        />

        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Agra"
        />

        <div className="grid two">
          <Input label="City" name="city" value={form.city} onChange={handleChange} />
          <Input label="State" name="state" value={form.state} onChange={handleChange} />
        </div>

        <div className="grid two">
          <Input label="Country" name="country" value={form.country} onChange={handleChange} />
          <Input label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Academy"}
        </Button>
      </form>
    </div>
  );
};

export default CreateAcademy;