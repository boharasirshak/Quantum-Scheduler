// Job class to manage job properties and operations
class Job {
  constructor(id) {
    this.id = id;
    this.arrivalTime = 0;
    this.burstTime = 0;
    this.remainingTime = 0;
    this.startTime = -1;
    this.endTime = 0;
    this.turnaroundTime = 0;
    this.lastExecutionTime = -1;
    this.inQueue = false;
  }

  reset() {
    this.remainingTime = this.burstTime;
    this.startTime = -1;
    this.endTime = 0;
    this.turnaroundTime = 0;
    this.lastExecutionTime = -1;
    this.inQueue = false;
  }

  updateProperty(property, value) {
    this[property] = parseFloat(value);
    if (property === "burstTime") {
      this.remainingTime = this.burstTime;
    }
  }
}

// Job management functions
const jobs = [];
const colors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F67280",
  "#C06C84",
];

function addJob() {
  const newJob = new Job(jobs.length + 1);
  jobs.push(newJob);
  updateJobTable();
}

function removeLastJob() {
  if (jobs.length > 0) {
    jobs.pop();
    updateJobTable();
  }
}

function updateJobTable() {
  const tableBody = document.querySelector("#jobTable tbody");
  tableBody.innerHTML = "";
  jobs.forEach((job, index) => {
    const row = tableBody.insertRow();
    row.innerHTML = `<td>J${job.id}</td>
                    <td><input type="number" value="${
                      job.arrivalTime
                    }" min="0" step="0.5" onchange="updateJobProperty(${index}, 'arrivalTime', this.value)"></td>
                    <td><input type="number" value="${
                      job.burstTime
                    }" min="0.5" step="0.5" onchange="updateJobProperty(${index}, 'burstTime', this.value)"></td>
                    <td>${
                      job.startTime === -1 ? "-" : job.startTime.toFixed(1)
                    }</td>
                    <td>${job.endTime.toFixed(1)}</td>
                    <td>${job.turnaroundTime.toFixed(1)}</td>`;
  });
}

function updateJobProperty(index, property, value) {
  jobs[index].updateProperty(property, value);
}

function calculateAverageTurnaroundTime() {
  const turnaroundTimes = jobs.map((job) => job.turnaroundTime);
  const totalTurnaroundTime = turnaroundTimes.reduce(
    (sum, time) => sum + time,
    0
  );
  const averageTurnaroundTime = totalTurnaroundTime / jobs.length;

  const calculation = turnaroundTimes.map((t) => t.toFixed(1)).join(" + ");
  const result = averageTurnaroundTime.toFixed(1);

  document.getElementById("averageTurnaroundTime").innerHTML = `
        Average Turnaround Time: (${calculation}) / ${jobs.length} = <b>${result}</b>
    `;
}
