const API_URL = "http://localhost:3000/subjects";

const subjectInput = document.getElementById("subjectInput");
const studyTimeInput = document.getElementById("studyTimeInput");
const dueDateInput = document.getElementById("dueDateInput");
const subjectList = document.getElementById("subjectList");
const searchInput = document.getElementById("searchInput");

let editingIndex = null; // Track which subject is being edited

// Load subjects from server and render, with optional filter
async function loadSubjects(filter = "") {
  try {
    const res = await fetch(API_URL);
    const subjects = await res.json();

    subjectList.innerHTML = "";

    // Filter subjects by name if filter is provided
    const filteredSubjects = subjects.filter((subject) =>
      subject.name.toLowerCase().includes(filter.toLowerCase())
    );

    filteredSubjects.forEach((subject, index) => {
      const li = document.createElement("li");

      if (index === editingIndex) {
        // Editing mode - show input fields + Save/Cancel buttons

        // Name input
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = subject.name || "";
        nameInput.style.marginRight = "5px";

        // Study Time input
        const studyTimeInputField = document.createElement("input");
        studyTimeInputField.type = "number";
        studyTimeInputField.min = "0";
        studyTimeInputField.value = subject.studyTime ?? 0;
        studyTimeInputField.style.width = "70px";
        studyTimeInputField.style.marginRight = "5px";

        // Due Date input
        const dueDateInputField = document.createElement("input");
        dueDateInputField.type = "date";
        dueDateInputField.value = subject.dueDate || "";
        dueDateInputField.style.marginRight = "5px";

        // Save button
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.onclick = async () => {
          const updatedName = nameInput.value.trim();
          const updatedStudyTime = parseFloat(studyTimeInputField.value);
          const updatedDueDate = dueDateInputField.value;

          if (!updatedName) {
            alert("Please enter a subject name.");
            return;
          }
          if (isNaN(updatedStudyTime) || updatedStudyTime < 0) {
            alert("Please enter a valid study time.");
            return;
          }
          if (!updatedDueDate) {
            alert("Please select a due date.");
            return;
          }

          const updatedSubject = {
            ...subject,
            name: updatedName,
            studyTime: updatedStudyTime,
            dueDate: updatedDueDate,
          };

          try {
            const res = await fetch(`${API_URL}/${index}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedSubject),
            });
            if (!res.ok) throw new Error("Failed to update subject");

            editingIndex = null; // Clear editing
            loadSubjects(filter);
          } catch (error) {
            console.error(error);
            alert("Error updating subject");
          }
        };

        // Cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.onclick = () => {
          editingIndex = null;
          loadSubjects(filter);
        };

        li.appendChild(nameInput);
        li.appendChild(studyTimeInputField);
        li.appendChild(dueDateInputField);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);
      } else {
        // Normal display mode

        const name = subject.name || "Unnamed";
        const studyTime = subject.studyTime ?? 0;
        const dueDate = subject.dueDate || "No due date";

        const textSpan = document.createElement("span");
        textSpan.textContent = `${name} — Study Time: ${studyTime} hrs — Due: ${dueDate}`;

        if (subject.completed) {
          textSpan.classList.add("completed-text");
        }

        // Checkbox for completed
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!subject.completed;
        checkbox.style.marginRight = "10px";
        checkbox.addEventListener("change", () => toggleCompleted(index, checkbox.checked));

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => {
          editingIndex = index;
          loadSubjects(filter);
        };

        // Delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.onclick = () => deleteSubject(index);

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(editBtn);
        li.appendChild(delBtn);
      }

      subjectList.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading subjects:", error);
  }
}

// Add subject to server
async function addSubject() {
  const name = subjectInput.value.trim();
  const studyTime = parseFloat(studyTimeInput.value.trim());
  const dueDate = dueDateInput.value;

  if (!name) {
    alert("Please enter a subject name.");
    return;
  }
  if (isNaN(studyTime) || studyTime < 0) {
    alert("Please enter a valid study time.");
    return;
  }
  if (!dueDate) {
    alert("Please select a due date.");
    return;
  }

  const newSubject = {
    name,
    studyTime,
    dueDate,
    completed: false,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSubject),
    });
    if (!res.ok) throw new Error("Failed to add subject");

    // Clear inputs
    subjectInput.value = "";
    studyTimeInput.value = "";
    dueDateInput.value = "";

    loadSubjects();
  } catch (error) {
    console.error(error);
    alert("Error adding subject");
  }
}

// Toggle completed on server
async function toggleCompleted(index, completed) {
  try {
    const resGet = await fetch(API_URL);
    const subjects = await resGet.json();

    if (!subjects[index]) {
      alert("Subject not found");
      return;
    }

    const updatedSubject = {
      ...subjects[index],
      completed,
    };

    const res = await fetch(`${API_URL}/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSubject),
    });
    if (!res.ok) throw new Error("Failed to update subject");

    loadSubjects();
  } catch (error) {
    console.error(error);
    alert("Failed to update subject");
  }
}

// Delete subject on server
async function deleteSubject(index) {
  if (!confirm("Delete this subject?")) return;
  try {
    await fetch(`${API_URL}/${index}`, { method: "DELETE" });
    // Clear editing if deleting the currently edited subject
    if (editingIndex === index) editingIndex = null;
    loadSubjects();
  } catch (error) {
    console.error(error);
    alert("Failed to delete subject");
  }
}

// Listen for input in search box and reload list accordingly
searchInput.addEventListener("input", () => {
  loadSubjects(searchInput.value);
});

// Initial load
loadSubjects();
