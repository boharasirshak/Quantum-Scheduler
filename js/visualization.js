function drawGanttChart(jobHistory, jobQueueHistory) {
  const ganttChart = document.getElementById("ganttChart");
  ganttChart.innerHTML = "";

  const maxEndTime = Math.max(...jobHistory.map((entry) => entry.endTime));
  const timeQuantum = parseFloat(document.getElementById("timeQuantum").value);

  // Draw CPU rows
  for (
    let i = 0;
    i < parseInt(document.getElementById("cpuCount").value);
    i++
  ) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "cpu-row";
    ganttChart.appendChild(rowDiv);

    let currentJobId = null;
    let currentBlock = null;
    let blockStartTime = null;

    jobHistory
      .filter((entry) => entry.cpuId === i)
      .forEach((entry, index) => {
        if (entry.jobId !== currentJobId) {
          if (currentBlock) {
            currentBlock.style.width = `${
              ((entry.startTime - blockStartTime) / maxEndTime) * 100
            }%`;
            rowDiv.appendChild(currentBlock);
          }

          currentJobId = entry.jobId;
          blockStartTime = entry.startTime;

          currentBlock = document.createElement("div");
          currentBlock.className = "job-block";
          if (entry.jobId === "idle") {
            currentBlock.classList.add("idle-block");
          } else {
            currentBlock.style.backgroundColor =
              colors[(entry.jobId - 1) % colors.length];
            currentBlock.textContent = `J${entry.jobId}`;
          }
        }

        if (index === jobHistory.filter((e) => e.cpuId === i).length - 1) {
          currentBlock.style.width = `${
            ((entry.endTime - blockStartTime) / maxEndTime) * 100
          }%`;
          rowDiv.appendChild(currentBlock);
        }
      });
  }

  // Add time axis and other visualizations
  const timeAxisDiv = document.createElement("div");
  timeAxisDiv.className = "time-axis";
  ganttChart.appendChild(timeAxisDiv);

  // Add time markers and job queues
  for (let t = 0; t <= maxEndTime; t += timeQuantum) {
    const markerDiv = document.createElement("div");
    markerDiv.className = "time-marker";
    markerDiv.style.left = `${(t / maxEndTime) * 100}%`;
    markerDiv.textContent = t.toFixed(1);
    timeAxisDiv.appendChild(markerDiv);

    const lineDiv = document.createElement("div");
    lineDiv.className = "dashed-line";
    lineDiv.style.left = `${(t / maxEndTime) * 100}%`;
    ganttChart.appendChild(lineDiv);

    const queueEntry = jobQueueHistory.find(
      (entry) => Math.abs(entry.time - t) < 0.001
    );
    if (queueEntry) {
      const queueDiv = document.createElement("div");
      queueDiv.className = "queue-container";
      queueDiv.style.left = `${(t / maxEndTime) * 100}%`;
      queueDiv.style.top = `${timeAxisDiv.offsetTop + 60}px`;

      const queueJobsDiv = document.createElement("div");
      queueJobsDiv.className = "queue-jobs";
      if (queueEntry.jobs.length > 0) {
        queueJobsDiv.innerHTML = queueEntry.jobs
          .map((job) => `J${job.id} = ${job.remainingTime.toFixed(1)}`)
          .join("<br>");
      } else {
        queueJobsDiv.innerHTML = "{ }";
      }
      queueDiv.appendChild(queueJobsDiv);
      ganttChart.appendChild(queueDiv);
    }
  }

  // Add job arrival markers
  jobs.forEach((job) => {
    if (job.arrivalTime > 0 && job.arrivalTime <= maxEndTime) {
      // Add job name marker
      const arrivalNameDiv = document.createElement("div");
      arrivalNameDiv.className = "job-arrival-name";
      arrivalNameDiv.style.left = `${(job.arrivalTime / maxEndTime) * 100}%`;
      arrivalNameDiv.textContent = `J${job.id}`;
      timeAxisDiv.appendChild(arrivalNameDiv);

      // Add arrival time marker
      const arrivalTimeDiv = document.createElement("div");
      arrivalTimeDiv.className = "job-arrival";
      arrivalTimeDiv.style.left = `${(job.arrivalTime / maxEndTime) * 100}%`;
      arrivalTimeDiv.textContent = job.arrivalTime.toFixed(1);
      timeAxisDiv.appendChild(arrivalTimeDiv);

      // Add arrival vertical line
      const arrivalLineDiv = document.createElement("div");
      arrivalLineDiv.className = "arrival-line";
      arrivalLineDiv.style.left = `${(job.arrivalTime / maxEndTime) * 100}%`;
      ganttChart.appendChild(arrivalLineDiv);
    }
  });

  // Adjust container height
  const containerHeight = ganttChart.offsetHeight + 100;
  document.getElementById(
    "ganttChartContainer"
  ).style.height = `${containerHeight}px`;
}
