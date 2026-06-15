import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const ANIMAL_SERVICE_URL =
  import.meta.env.VITE_ANIMAL_SERVICE_URL || "http://localhost:3001";

const ADOPTION_SERVICE_URL =
  import.meta.env.VITE_ADOPTION_SERVICE_URL || "http://localhost:3002";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400?text=PetAdopt";

function App() {
  const [activePanel, setActivePanel] = useState("user");
  const [animals, setAnimals] = useState([]);
  const [requests, setRequests] = useState([]);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoginForm, setAdminLoginForm] = useState({
    username: "",
    password: "",
  });
  const [adminLoginError, setAdminLoginError] = useState("");

  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const [animalForm, setAnimalForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    description: "",
    imageUrl: "",
  });

  const [editingAnimal, setEditingAnimal] = useState(null);

  const [editAnimalForm, setEditAnimalForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    description: "",
    imageUrl: "",
    status: "AVAILABLE",
  });

  const [requestForm, setRequestForm] = useState({
    applicantName: "",
    applicantEmail: "",
    message: "",
  });

  async function loadAnimals() {
    const response = await axios.get(`${ANIMAL_SERVICE_URL}/animals`);
    setAnimals(response.data);
  }

  async function loadRequests() {
    try {
      const response = await axios.get(
        `${ADOPTION_SERVICE_URL}/adoption-requests`
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error loading adoption requests:", error);
      setRequests([]);
    }
  }

  async function loadData() {
    await loadAnimals();
    await loadRequests();
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAdoptionModal(animal) {
    if (animal.status !== "AVAILABLE") {
      return;
    }

    setSelectedAnimal(animal);
    setRequestForm({
      applicantName: "",
      applicantEmail: "",
      message: "",
    });
  }

  function closeAdoptionModal() {
    setSelectedAnimal(null);
  }

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
      imageUrl: "",
    });

    await loadAnimals();
  }

  async function createRequest(event) {
    event.preventDefault();

    if (!selectedAnimal) {
      return;
    }

    await axios.post(`${ADOPTION_SERVICE_URL}/adoption-requests`, {
      animalId: selectedAnimal.id,
      applicantName: requestForm.applicantName,
      applicantEmail: requestForm.applicantEmail,
      message: requestForm.message,
    });

    closeAdoptionModal();
    await loadRequests();
  }

  async function approveRequest(id) {
    await axios.patch(`${ADOPTION_SERVICE_URL}/adoption-requests/${id}/approve`);
    await loadData();
  }

  async function rejectRequest(id) {
    await axios.patch(`${ADOPTION_SERVICE_URL}/adoption-requests/${id}/reject`);
    await loadRequests();
  }

  function getAnimalName(animalId) {
    const animal = animals.find((item) => item.id === animalId);
    return animal ? animal.name : `Animal #${animalId}`;
  }

  function handleAdminLogin(event) {
  event.preventDefault();

  if (
    adminLoginForm.username === "admincentru" &&
    adminLoginForm.password === "123456789"
  ) {
    setIsAdminLoggedIn(true);
    setAdminLoginError("");
    setAdminLoginForm({
      username: "",
      password: "",
    });
  } else {
    setAdminLoginError("Username sau parolă greșită.");
  }
}

function handleAdminLogout() {
  setIsAdminLoggedIn(false);
  setActivePanel("user");
}

function startEditAnimal(animal) {
  setEditingAnimal(animal);

  setEditAnimalForm({
    name: animal.name || "",
    species: animal.species || "",
    breed: animal.breed || "",
    age: animal.age || "",
    description: animal.description || "",
    imageUrl: animal.image_url || "",
    status: animal.status || "AVAILABLE",
  });
}

function cancelEditAnimal() {
  setEditingAnimal(null);

  setEditAnimalForm({
    name: "",
    species: "",
    breed: "",
    age: "",
    description: "",
    imageUrl: "",
    status: "AVAILABLE",
  });
}

async function updateAnimal(event) {
  event.preventDefault();

  if (!editingAnimal) {
    return;
  }

  await axios.put(`${ANIMAL_SERVICE_URL}/animals/${editingAnimal.id}`, {
    ...editAnimalForm,
    age: Number(editAnimalForm.age),
  });

  cancelEditAnimal();
  await loadAnimals();
}

async function deleteAnimal(id) {
  const confirmed = window.confirm(
    "Sigur vrei să ștergi acest animal? Se vor șterge și cererile de adopție asociate."
  );

  if (!confirmed) {
    return;
  }

  try {
    await axios.delete(`${ADOPTION_SERVICE_URL}/adoption-requests/animal/${id}`);
    await axios.delete(`${ANIMAL_SERVICE_URL}/animals/${id}`);

    await loadData();
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Animalul nu a putut fi șters. Verifică serviciile și încearcă din nou."
    );
  }
}

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">PetAdopt Cloud</p>
          <h1>Centru de adopție pentru animale</h1>
          <p>
            Găsește un prieten blănos, trimite o cerere de adopție și urmărește
            statusul acesteia.
          </p>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={activePanel === "user" ? "tab active" : "tab"}
          onClick={() => setActivePanel("user")}
        >
          User Panel
        </button>

        <button
          className={activePanel === "admin" ? "tab active" : "tab"}
          onClick={() => setActivePanel("admin")}
        >
          Admin Panel
        </button>
      </nav>

      {activePanel === "user" && (
        <main className="panel">
          <section className="section-header">
            <div>
              <h2>Animale disponibile</h2>
              <p>Apasă pe un animal disponibil pentru a trimite o cerere.</p>
            </div>

            <button className="secondary-button" onClick={loadData}>
              Actualizează
            </button>
          </section>

          <section className="animal-grid">
            {animals.map((animal) => (
              <article
                key={animal.id}
                className={
                  animal.status === "AVAILABLE"
                    ? "animal-card"
                    : "animal-card disabled"
                }
                onClick={() => openAdoptionModal(animal)}
              >
                <img
                  src={animal.image_url || PLACEHOLDER_IMAGE}
                  alt={animal.name}
                  className="animal-image"
                />

                <div className="animal-content">
                  <div className="animal-top">
                    <h3>{animal.name}</h3>
                    <span
                      className={
                        animal.status === "AVAILABLE"
                          ? "badge available"
                          : "badge adopted"
                      }
                    >
                      {animal.status}
                    </span>
                  </div>

                  <p className="animal-meta">
                    {animal.species} • {animal.breed || "Rasă necunoscută"} •{" "}
                    {animal.age || "?"} ani
                  </p>

                  <p className="animal-description">{animal.description}</p>

                  {animal.status === "AVAILABLE" ? (
                    <button className="primary-button">Cere adopția</button>
                  ) : (
                    <p className="unavailable-text">Animal deja adoptat</p>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="card">
            <h2>Cererile trimise</h2>
            <p className="muted">
              Aici se vede statusul cererilor: PENDING, APPROVED sau REJECTED.
            </p>

            <div className="request-list">
              {requests.length === 0 && (
                <p className="empty-text">Nu există cereri de adopție.</p>
              )}

              {requests.map((request) => (
                <div key={request._id} className="request-item">
                  <div>
                    <strong>{getAnimalName(request.animalId)}</strong>
                    <p>
                      {request.applicantName} • {request.applicantEmail}
                    </p>
                    <p>{request.message}</p>
                  </div>

                  <span className={`badge ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

{activePanel === "admin" && !isAdminLoggedIn && (
  <main className="panel">
    <section className="login-card">
      <h2>Autentificare administrator</h2>
      <p className="muted">
        Introdu datele de administrator pentru a accesa panoul de administrare.
      </p>

      <form onSubmit={handleAdminLogin} className="form">
        <input
          placeholder="Username"
          value={adminLoginForm.username}
          onChange={(e) =>
            setAdminLoginForm({
              ...adminLoginForm,
              username: e.target.value,
            })
          }
          required
        />

        <input
          placeholder="Parolă"
          type="password"
          value={adminLoginForm.password}
          onChange={(e) =>
            setAdminLoginForm({
              ...adminLoginForm,
              password: e.target.value,
            })
          }
          required
        />

        {adminLoginError && (
          <p className="error-text">{adminLoginError}</p>
        )}

        <button type="submit" className="primary-button">
          Intră în Admin Panel
        </button>
      </form>
    </section>
  </main>
)}

  {activePanel === "admin" && isAdminLoggedIn && (
    <main className="panel admin-layout">
      <section className="admin-toolbar">
        <div>
          <h2>Admin Panel</h2>
          <p className="muted">
            Ești autentificată ca administrator al centrului.
          </p>
        </div>

        <button className="secondary-button" onClick={handleAdminLogout}>
          Logout
        </button>
      </section>

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

          <input
            placeholder="URL poză"
            value={animalForm.imageUrl}
            onChange={(e) =>
              setAnimalForm({ ...animalForm, imageUrl: e.target.value })
            }
          />

          <textarea
            placeholder="Descriere"
            value={animalForm.description}
            onChange={(e) =>
              setAnimalForm({
                ...animalForm,
                description: e.target.value,
              })
            }
          />

          <button type="submit" className="primary-button">
            Adaugă animal
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Lista animale</h2>

        <div className="compact-list">
          {animals.map((animal) => (
            <div key={animal.id} className="compact-item admin-animal-item">
              <img
                src={animal.image_url || PLACEHOLDER_IMAGE}
                alt={animal.name}
              />

              <div>
                <strong>
                  #{animal.id} {animal.name}
                </strong>
                <p>
                  {animal.species} • {animal.breed || "Rasă necunoscută"} •{" "}
                  {animal.age || "?"} ani
                </p>
              </div>

              <span
                className={
                  animal.status === "AVAILABLE"
                    ? "badge available"
                    : "badge adopted"
                }
              >
                {animal.status}
              </span>

              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => startEditAnimal(animal)}
                >
                  Editează
                </button>

                <button
                  className="reject-button"
                  onClick={() => deleteAnimal(animal.id)}
                >
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-requests">
        <h2>Cereri de adopție</h2>

        <div className="request-list">
          {requests.length === 0 && (
            <p className="empty-text">Nu există cereri de adopție.</p>
          )}

          {requests.map((request) => (
            <div key={request._id} className="request-item admin-request">
              <div>
                <strong>{getAnimalName(request.animalId)}</strong>
                <p>
                  Solicitant: {request.applicantName} •{" "}
                  {request.applicantEmail}
                </p>
                <p>{request.message}</p>
              </div>

              <div className="request-actions">
                <span className={`badge ${request.status.toLowerCase()}`}>
                  {request.status}
                </span>

                {request.status === "PENDING" && (
                  <div className="button-row">
                    <button
                      className="approve-button"
                      onClick={() => approveRequest(request._id)}
                    >
                      Approve
                    </button>

                    <button
                      className="reject-button"
                      onClick={() => rejectRequest(request._id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )}

    {editingAnimal && (
    <div className="modal-backdrop" onClick={cancelEditAnimal}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={cancelEditAnimal}>
          ×
        </button>

        <h2>Editează animal</h2>
        <p className="muted">Modifică datele animalului selectat.</p>

        <form onSubmit={updateAnimal} className="form">
          <input
            placeholder="Nume"
            value={editAnimalForm.name}
            onChange={(e) =>
              setEditAnimalForm({ ...editAnimalForm, name: e.target.value })
            }
            required
          />

          <input
            placeholder="Specie"
            value={editAnimalForm.species}
            onChange={(e) =>
              setEditAnimalForm({ ...editAnimalForm, species: e.target.value })
            }
            required
          />

          <input
            placeholder="Rasă"
            value={editAnimalForm.breed}
            onChange={(e) =>
              setEditAnimalForm({ ...editAnimalForm, breed: e.target.value })
            }
          />

          <input
            placeholder="Vârstă"
            type="number"
            value={editAnimalForm.age}
            onChange={(e) =>
              setEditAnimalForm({ ...editAnimalForm, age: e.target.value })
            }
          />

          <input
            placeholder="URL poză"
            value={editAnimalForm.imageUrl}
            onChange={(e) =>
              setEditAnimalForm({ ...editAnimalForm, imageUrl: e.target.value })
            }
          />

          <select
            value={editAnimalForm.status}
            onChange={(e) =>
              setEditAnimalForm({ ...editAnimalForm, status: e.target.value })
            }
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ADOPTED">ADOPTED</option>
          </select>

          <textarea
            placeholder="Descriere"
            value={editAnimalForm.description}
            onChange={(e) =>
              setEditAnimalForm({
                ...editAnimalForm,
                description: e.target.value,
              })
            }
          />

          <button type="submit" className="primary-button">
            Salvează modificările
          </button>
        </form>
      </div>
    </div>
  )}

      {selectedAnimal && (
        <div className="modal-backdrop" onClick={closeAdoptionModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeAdoptionModal}>
              ×
            </button>

            <img
              src={selectedAnimal.image_url || PLACEHOLDER_IMAGE}
              alt={selectedAnimal.name}
              className="modal-image"
            />

            <h2>Cerere adopție pentru {selectedAnimal.name}</h2>
            <p className="muted">
              Completează datele tale pentru a trimite cererea de adopție.
            </p>

            <form onSubmit={createRequest} className="form">
              <input
                placeholder="Numele tău"
                value={requestForm.applicantName}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    applicantName: e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="Email"
                type="email"
                value={requestForm.applicantEmail}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    applicantEmail: e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Mesaj"
                value={requestForm.message}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    message: e.target.value,
                  })
                }
              />

              <button type="submit" className="primary-button">
                Trimite cererea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;