function calculateSRTN() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeQuantum = 1.0; // Fixed to 1 second intervals

  // Reset job states
  jobs.forEach((job) => job.reset());

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];

  const timeStep = 0.5; // Keep 0.5 for visualization granularity
  let nextScheduleTime = 1.0; // Next scheduling decision point

  while (completedJobs < jobs.length) {
    // Check for new arrivals at current time
    jobs.forEach((job) => {
      if (
        Math.abs(job.arrivalTime - currentTime) < 0.001 &&
        job.remainingTime > 0 &&
        !job.inQueue &&
        !runningJobs.includes(job)
      ) {
        jobQueue.push(job);
        job.inQueue = true;
      }
    });

    // Check for completed jobs and fill vacant spaces
    runningJobs.forEach((runningJob, cpuIndex) => {
      if (runningJob === null || runningJob.remainingTime <= 0.001) {
        if (runningJob && runningJob.remainingTime <= 0.001) {
          runningJob.endTime = currentTime;
          runningJob.turnaroundTime =
            runningJob.endTime - runningJob.arrivalTime;
          completedJobs++;
        }
        runningJobs[cpuIndex] = null;

        // Sort queue by remaining time and arrival time
        jobQueue.sort((a, b) => {
          if (Math.abs(a.remainingTime - b.remainingTime) < 0.001) {
            return a.arrivalTime - b.arrivalTime;
          }
          return a.remainingTime - b.remainingTime;
        });

        // Fill vacant space with next available job
        if (jobQueue.length > 0) {
          const nextJob = jobQueue.shift();
          if (nextJob.startTime === -1) {
            nextJob.startTime = currentTime;
          }
          runningJobs[cpuIndex] = nextJob;
        }
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

    // Process current time step
    runningJobs.forEach((job, cpuIndex) => {
      if (job !== null) {
        jobHistory.push({
          jobId: job.id,
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });

        job.remainingTime -= timeStep;
      } else {
        jobHistory.push({
          jobId: "idle",
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });
      }
    });

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

  const timeStep = 0.5;

  while (completedJobs < jobs.length) {
    // Check for new arrivals
    jobs.forEach((job) => {
      if (
        Math.abs(job.arrivalTime - currentTime) < 0.001 &&
        !jobQueue.includes(job) &&
        job.remainingTime > 0 &&
        !runningJobs.includes(job)
      ) {
        jobQueue.push(job);
      }
    });

    // Check for quantum expiration and completed jobs
    runningJobs.forEach((runningJob, cpuIndex) => {
      if (runningJob !== null) {
        const jobRunTime = currentTime - runningJob.lastExecutionTime;
        if (jobRunTime >= timeQuantum || runningJob.remainingTime <= 0.001) {
          if (runningJob.remainingTime <= 0.001) {
            runningJob.endTime = currentTime;
            runningJob.turnaroundTime =
              runningJob.endTime - runningJob.arrivalTime;
            completedJobs++;
          } else {
            jobQueue.push(runningJob);
          }
          runningJobs[cpuIndex] = null;
        }
      }

      // Fill vacant CPU with next job from queue
      if (runningJobs[cpuIndex] === null && jobQueue.length > 0) {
        const nextJob = jobQueue.shift();
        if (nextJob.startTime === -1) {
          nextJob.startTime = currentTime;
        }
        nextJob.lastExecutionTime = currentTime;
        runningJobs[cpuIndex] = nextJob;
      }
    });

    // Record queue state
    jobQueueHistory.push({
      time: currentTime,
      jobs: jobQueue.map((job) => ({
        id: job.id,
        remainingTime: parseFloat(job.remainingTime.toFixed(1)),
      })),
    });

    // Process current time step
    runningJobs.forEach((job, cpuIndex) => {
      if (job !== null) {
        jobHistory.push({
          jobId: job.id,
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });

        job.remainingTime -= timeStep;
      } else {
        jobHistory.push({
          jobId: "idle",
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep,
        });
      }
    });

    currentTime += timeStep;
  }

  updateJobTable();
  calculateAverageTurnaroundTime();
  drawGanttChart(jobHistory, jobQueueHistory);
}
