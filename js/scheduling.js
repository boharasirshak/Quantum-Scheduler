function calculateSRTN() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeQuantum = parseFloat(document.getElementById("timeQuantum").value);

  // Reset job states
  jobs.forEach((job) => job.reset());

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];

  const timeStep = 0.5; // Define minimum time step as 0.5 units

  while (completedJobs < jobs.length) {
    // Check for new arrivals at current time
    jobs.forEach((job) => {
      if (
        Math.abs(job.arrivalTime - currentTime) < 0.001 &&
        job.remainingTime > 0 &&
        !job.inQueue
      ) {
        jobQueue.push(job);
        job.inQueue = true;
      }
    });

    // At time quantum intervals or when any job completes
    if (
      Math.abs(currentTime % timeQuantum) < 0.001 ||
      runningJobs.some((job) => job && job.remainingTime < timeStep)
    ) {
      // Return running jobs to queue if they're not finished
      runningJobs.forEach((runningJob, index) => {
        if (runningJob !== null && runningJob.remainingTime > 0) {
          jobQueue.push(runningJob);
          runningJobs[index] = null;
        }
      });

      // Sort queue by remaining time and arrival time
      jobQueue.sort((a, b) => {
        if (Math.abs(a.remainingTime - b.remainingTime) < 0.001) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.remainingTime - b.remainingTime;
      });

      // Record queue state for visualization
      jobQueueHistory.push({
        time: currentTime,
        jobs: jobQueue.map((job) => ({
          id: job.id,
          remainingTime: parseFloat(job.remainingTime.toFixed(1)),
        })),
      });

      // Assign jobs to available CPUs
      for (let i = 0; i < cpuCount && jobQueue.length > 0; i++) {
        if (runningJobs[i] === null) {
          let job = jobQueue.shift();
          if (job.startTime === -1) {
            job.startTime = currentTime;
          }
          runningJobs[i] = job;
        }
      }
    }

    // Process current time unit
    for (let i = 0; i < cpuCount; i++) {
      if (runningJobs[i]) {
        let job = runningJobs[i];
        jobHistory.push({
          jobId: job.id,
          cpuId: i,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });

        job.remainingTime -= timeStep;

        if (job.remainingTime < timeStep) {
          job.endTime = currentTime + timeStep;
          job.turnaroundTime = job.endTime - job.arrivalTime;
          completedJobs++;
          runningJobs[i] = null;
        }
      } else {
        jobHistory.push({
          jobId: "idle",
          cpuId: i,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });
      }
    }

    currentTime += timeStep;
  }

  updateJobTable();
  calculateAverageTurnaroundTime();
  drawGanttChart(jobHistory, jobQueueHistory);
}

function calculateRoundRobin() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeQuantum = parseFloat(document.getElementById("timeQuantum").value);

  // Reset job states
  jobs.forEach((job) => job.reset());

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobQueue = [];
  let jobHistory = [];
  let jobQueueHistory = [];

  const timeStep = 0.5; // Define minimum time step as 0.5 units

  while (completedJobs < jobs.length) {
    // Check for new arrivals
    jobs.forEach((job) => {
      if (
        Math.abs(job.arrivalTime - currentTime) < 0.001 &&
        !jobQueue.includes(job) &&
        job.remainingTime > 0
      ) {
        jobQueue.push(job);
      }
    });

    if (Math.abs(currentTime % timeQuantum) < 0.001) {
      // Return running jobs to queue if they're not finished
      runningJobs.forEach((runningJob, index) => {
        if (runningJob !== null) {
          if (runningJob.remainingTime > 0) {
            jobQueue.push(runningJob);
          }
          runningJobs[index] = null;
        }
      });

      // Record queue state for visualization
      jobQueueHistory.push({
        time: currentTime,
        jobs: jobQueue.map((job) => ({
          id: job.id,
          remainingTime: parseFloat(job.remainingTime.toFixed(1)),
        })),
      });

      // Assign jobs to available CPUs
      for (let i = 0; i < cpuCount && jobQueue.length > 0; i++) {
        if (runningJobs[i] === null) {
          let job = jobQueue.shift();
          if (job.startTime === -1) {
            job.startTime = currentTime;
          }
          runningJobs[i] = job;
        }
      }
    }

    // Process each CPU
    for (let i = 0; i < cpuCount; i++) {
      if (runningJobs[i] !== null) {
        let job = runningJobs[i];

        job.remainingTime -= timeStep;

        jobHistory.push({
          jobId: job.id,
          cpuId: i,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });

        if (job.remainingTime < timeStep) {
          job.endTime = currentTime + timeStep;
          job.turnaroundTime = job.endTime - job.arrivalTime;
          completedJobs++;
          runningJobs[i] = null;
        }
      } else {
        jobHistory.push({
          jobId: "idle",
          cpuId: i,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });
      }
    }

    currentTime += timeStep;
  }

  updateJobTable();
  calculateAverageTurnaroundTime();
  drawGanttChart(jobHistory, jobQueueHistory);
}
