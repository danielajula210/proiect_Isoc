import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const ANIMAL_SERVICE_URL =
  import.meta.env.VITE_ANIMAL_SERVICE_URL || "http://localhost:3001";

const ADOPTION_SERVICE_URL =
  import.meta.env.VITE_ADOPTION_SERVICE_URL || "http://localhost:3002";

function App() {
  const [animals, setAnimals] = useState([]);
  const [requests, setRequests] = useState([]);

  const [animalForm, setAnimalForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    description: "",
  });

  const [requestForm, setRequestForm] = useState({
    animalId: "",
    applicantName: "",
    applicantEmail: "",
    message: "",
  });

  async function loadAnimals() {
    const response = await axios.get(`${ANIMAL_SERVICE_URL}/animals`);
    setAnimals(response.data);
  }

  async function loadRequests() {
    const response = await axios.get(`${ADOPTION_SERVICE_URL}/adoption-requests`);
    setRequests(response.data);
  }

  useEffect(() => {
    loadAnimals();
    loadRequests();
  }, []);

  async function addAnimal(event) {
    event.preventDefault();

    await axios.post(`${ANIMAL_SERVICE_URL}/animals`, {
      ...animalForm,
      age: Number(animalForm.age),
    });

    setAnimalForm({
      name: "",
      species: "",
      breed: "",
      age: "",
      description: "",
    });

    loadAnimals();
  }

  async function createRequest(event) {
    event.preventDefault();

    await axios.post(`${ADOPTION_SERVICE_URL}/adoption-requests`, {
      ...requestForm,
      animalId: Number(requestForm.animalId),
    });

    setRequestForm({
      animalId: "",
      applicantName: "",
      applicantEmail: "",
      message: "",
    });

    loadRequests();
  }

  async function approveRequest(id) {
    await axios.patch(`${ADOPTION_SERVICE_URL}/adoption-requests/${id}/approve`);
    loadRequests();
    loadAnimals();
  }

  async function rejectRequest(id) {
    await axios.patch(`${ADOPTION_SERVICE_URL}/adoption-requests/${id}/reject`);
    loadRequests();
  }

  return (
    <div className="app">
      <h1>PetAdopt Cloud</h1>
      <p className="subtitle">Aplicație pentru centru de adopție animale</p>

      <section className="card">
        <h2>Adaugă animal</h2>

        <form onSubmit={addAnimal} className="form">
          <input
            placeholder="Nume"
            value={animalForm.name}
            onChange={(e) =>
              setAnimalForm({ ...animalForm, name: e.target.value })
            }
            required
          />

          <input
            placeholder="Specie"
            value={animalForm.species}
            onChange={(e) =>
              setAnimalForm({ ...animalForm, species: e.target.value })
            }
            required
          />

          <input
            placeholder="Rasă"
            value={animalForm.breed}
            onChange={(e) =>
              setAnimalForm({ ...animalForm, breed: e.target.value })
            }
          />

          <input
            placeholder="Vârstă"
            type="number"
            value={animalForm.age}
            onChange={(e) =>
              setAnimalForm({ ...animalForm, age: e.target.value })
            }
          />

          <textarea
            placeholder="Descriere"
            value={animalForm.description}
            onChange={(e) =>
              setAnimalForm({ ...animalForm, description: e.target.value })
            }
          />

          <button type="submit">Adaugă animal</button>
        </form>
      </section>

      <section className="card">
        <h2>Animale disponibile în centru</h2>

        <div className="list">
          {animals.map((animal) => (
            <div key={animal.id} className="item">
              <h3>{animal.name}</h3>
              <p>
                {animal.species} • {animal.breed} • {animal.age} ani
              </p>
              <p>{animal.description}</p>
              <strong>Status: {animal.status}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Trimite cerere de adopție</h2>

        <form onSubmit={createRequest} className="form">
          <input
            placeholder="ID animal"
            type="number"
            value={requestForm.animalId}
            onChange={(e) =>
              setRequestForm({ ...requestForm, animalId: e.target.value })
            }
            required
          />

          <input
            placeholder="Nume solicitant"
            value={requestForm.applicantName}
            onChange={(e) =>
              setRequestForm({ ...requestForm, applicantName: e.target.value })
            }
            required
          />

          <input
            placeholder="Email solicitant"
            type="email"
            value={requestForm.applicantEmail}
            onChange={(e) =>
              setRequestForm({ ...requestForm, applicantEmail: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Mesaj"
            value={requestForm.message}
            onChange={(e) =>
              setRequestForm({ ...requestForm, message: e.target.value })
            }
          />

          <button type="submit">Trimite cerere</button>
        </form>
      </section>

      <section className="card">
        <h2>Cereri de adopție</h2>

        <div className="list">
          {requests.map((request) => (
            <div key={request._id} className="item">
              <p>
                <strong>Animal ID:</strong> {request.animalId}
              </p>
              <p>
                <strong>Solicitant:</strong> {request.applicantName}
              </p>
              <p>
                <strong>Email:</strong> {request.applicantEmail}
              </p>
              <p>{request.message}</p>
              <strong>Status: {request.status}</strong>

              {request.status === "PENDING" && (
                <div className="buttons">
                  <button onClick={() => approveRequest(request._id)}>
                    Aprobă
                  </button>
                  <button onClick={() => rejectRequest(request._id)}>
                    Respinge
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;