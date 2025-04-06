function drawGanttChart(jobHistory, jobQueueHistory) {
  const ganttChart = document.getElementById("ganttChart");
  ganttChart.innerHTML = "";

  const maxEndTime = Math.ceil(Math.max(...jobHistory.map((entry) => entry.endTime)));
  
  // Create container for better alignment
  const chartContainer = document.createElement("div");
  chartContainer.style.position = "relative";
  chartContainer.style.width = "100%";
  ganttChart.appendChild(chartContainer);

  // Draw CPU rows
  for (let i = 0; i < parseInt(document.getElementById("cpuCount").value); i++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "cpu-row";
    chartContainer.appendChild(rowDiv);

    // Get jobs for this CPU
    const cpuJobs = jobHistory.filter((entry) => entry.cpuId === i);
    
    // Create blocks based on actual job intervals
    cpuJobs.forEach((job) => {
      const blockDiv = document.createElement("div");
      blockDiv.className = "job-block";
      
      // Calculate position and width
      const startPercent = (job.startTime / maxEndTime) * 100;
      const widthPercent = ((job.endTime - job.startTime) / maxEndTime) * 100;
      
      blockDiv.style.position = "absolute";
      blockDiv.style.left = `${startPercent}%`;
      blockDiv.style.width = `${widthPercent}%`;
      
      if (job.jobId === "idle") {
        blockDiv.classList.add("idle-block");
      } else {
        blockDiv.style.backgroundColor = colors[(job.jobId - 1) % colors.length];
        blockDiv.textContent = `J${job.jobId}`;
      }
      
      rowDiv.appendChild(blockDiv);
    });
  }

  // Add time axis
  const timeAxisDiv = document.createElement("div");
  timeAxisDiv.className = "time-axis";
  chartContainer.appendChild(timeAxisDiv);

  // Add grid lines container
  const gridContainer = document.createElement("div");
  gridContainer.className = "grid-container";
  chartContainer.appendChild(gridContainer);

  // Add time markers and grid lines
  for (let t = 0; t <= maxEndTime; t += 1.0) {
    // Add grid line
    const gridLine = document.createElement("div");
    gridLine.className = "grid-line";
    gridLine.style.left = `${(t / maxEndTime) * 100}%`;
    gridContainer.appendChild(gridLine);

    // Add time marker
    const markerDiv = document.createElement("div");
    markerDiv.className = "time-marker";
    markerDiv.style.left = `${(t / maxEndTime) * 100}%`;
    markerDiv.textContent = t.toFixed(1);
    timeAxisDiv.appendChild(markerDiv);

    // Add queue information
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
      chartContainer.appendChild(queueDiv);
    }
  }

  // Add job arrival markers
  jobs.forEach((job) => {
    if (job.arrivalTime >= 0 && job.arrivalTime <= maxEndTime) {
      const arrivalPercent = (job.arrivalTime / maxEndTime) * 100;
      
      // Add job name marker
      const arrivalNameDiv = document.createElement("div");
      arrivalNameDiv.className = "job-arrival-name";
      arrivalNameDiv.style.left = `${arrivalPercent}%`;
      arrivalNameDiv.textContent = `J${job.id}`;
      timeAxisDiv.appendChild(arrivalNameDiv);

      // Add arrival time marker
      const arrivalTimeDiv = document.createElement("div");
      arrivalTimeDiv.className = "job-arrival";
      arrivalTimeDiv.style.left = `${arrivalPercent}%`;
      arrivalTimeDiv.textContent = job.arrivalTime.toFixed(1);
      timeAxisDiv.appendChild(arrivalTimeDiv);

      // Add arrival vertical line
      const arrivalLineDiv = document.createElement("div");
      arrivalLineDiv.className = "arrival-line";
      arrivalLineDiv.style.left = `${arrivalPercent}%`;
      chartContainer.appendChild(arrivalLineDiv);
    }
  });

  // Adjust container height
  const containerHeight = chartContainer.offsetHeight + 100;
  document.getElementById("ganttChartContainer").style.height = `${containerHeight}px`;
}
