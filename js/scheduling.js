function calculateSRTN() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeStep = 1.0; // Use consistent 1-second blocks

  // Reset job states
  jobs.forEach((job) => job.reset());

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];

  while (completedJobs < jobs.length || runningJobs.some((job) => job !== null)) {
    // Check for new arrivals
    jobs.forEach((job) => {
      if (Math.abs(job.arrivalTime - currentTime) < 0.001 && 
          job.remainingTime > 0 && 
          !jobQueue.includes(job) && 
          !runningJobs.includes(job)) {
        jobQueue.push(job);
      }
    });

    // Check for completed jobs
    runningJobs.forEach((job, index) => {
      if (job && job.remainingTime <= 0.001) {
        job.endTime = currentTime;
        job.turnaroundTime = job.endTime - job.arrivalTime;
        completedJobs++;
        runningJobs[index] = null;
      }
    });

    // Check if any new job in queue is shorter than running jobs
    let needPreemption = false;
    if (jobQueue.length > 0) {
      const smallestInQueue = jobQueue.reduce(
        (min, job) => (job.remainingTime < min ? job.remainingTime : min),
        Infinity
      );
      runningJobs.forEach((job) => {
        if (job && smallestInQueue < job.remainingTime) {
          needPreemption = true;
        }
      });
    }

    // If preemption needed, return running jobs to queue
    if (needPreemption) {
      runningJobs.forEach((job, index) => {
        if (job) {
          jobQueue.push(job);
          runningJobs[index] = null;
        }
      });
    }

    // Sort queue by remaining time and arrival time
    jobQueue.sort((a, b) => {
      if (Math.abs(a.remainingTime - b.remainingTime) < 0.001) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.remainingTime - b.remainingTime;
    });

    // Record queue state
    jobQueueHistory.push({
      time: currentTime,
      jobs: jobQueue.map((job) => ({
        id: job.id,
        remainingTime: parseFloat(job.remainingTime.toFixed(1)),
      })),
    });

    // Assign jobs to CPUs
    for (let i = 0; i < cpuCount; i++) {
      if (runningJobs[i] === null && jobQueue.length > 0) {
        const nextJob = jobQueue.shift();
        if (nextJob.startTime === -1) nextJob.startTime = currentTime;
        runningJobs[i] = nextJob;
      }
    }

    // Process current time step
    runningJobs.forEach((job, cpuIndex) => {
      if (job !== null) {
        // Add history entry for this time step
        jobHistory.push({
          jobId: job.id,
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep
        });
        job.remainingTime -= timeStep;
      } else {
        // Add idle block
        jobHistory.push({
          jobId: "idle",
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep
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
  const timeStep = 1.0;

  // Reset job states
  jobs.forEach((job) => job.reset());

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobQueue = [];
  let jobHistory = [];
  let jobQueueHistory = [];

  while (completedJobs < jobs.length) {
    // Check for new arrivals
    jobs.forEach((job) => {
      if (Math.abs(job.arrivalTime - currentTime) < 0.001 && 
          !jobQueue.includes(job) && 
          job.remainingTime > 0 && 
          !runningJobs.includes(job)) {
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
            runningJob.turnaroundTime = runningJob.endTime - runningJob.arrivalTime;
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
          endTime: currentTime + timeStep
        });
        job.remainingTime -= timeStep;
      } else {
        jobHistory.push({
          jobId: "idle",
          cpuId: cpuIndex,
          startTime: currentTime,
          endTime: currentTime + timeStep
        });
      }
    });

    currentTime += timeStep;
  }

  updateJobTable();
  calculateAverageTurnaroundTime();
  drawGanttChart(jobHistory, jobQueueHistory);
}
