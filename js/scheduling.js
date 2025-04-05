function calculateSRTN() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeStep = 0.5;

  // Reset job states
  jobs.forEach((job) => job.reset());

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];
  let nextScheduleTime = 0.0; // Start scheduling from time 0
  let newJobArrived = false;
  let needRescheduleAfterCompletions = false;

  while (completedJobs < jobs.length) {
    newJobArrived = false;
    needRescheduleAfterCompletions = false;

    // Check for new arrivals
    jobs.forEach((job) => {
      if (
        Math.abs(job.arrivalTime - currentTime) < 0.001 &&
        job.remainingTime > 0 &&
        !jobQueue.includes(job) &&
        !runningJobs.includes(job)
      ) {
        jobQueue.push(job);
        newJobArrived = true;
      }
    });

    // Check if we need to reschedule
    let shouldReschedule = false;

    // Check for completed jobs
    let completedJobFound = false;
    runningJobs.forEach((job, index) => {
      if (job && job.remainingTime <= 0.001) {
        completedJobFound = true;
        job.endTime = currentTime + timeStep;
        job.turnaroundTime = job.endTime - job.arrivalTime;
        completedJobs++;
        runningJobs[index] = null;
        needRescheduleAfterCompletions = true;
      }
    });

    if (completedJobFound) {
      shouldReschedule = true;
    }

    // Reschedule at 1-second intervals, when a new job arrives, or when a job completes
    if (
      Math.abs(currentTime - nextScheduleTime) < 0.001 ||
      newJobArrived ||
      completedJobFound
    ) {
      // Check if any new job has shorter remaining time than running jobs
      let needPreemption = false;

      if (jobQueue.length > 0) {
        // Find smallest remaining time in queue
        const smallestInQueue = jobQueue.reduce(
          (min, job) => (job.remainingTime < min ? job.remainingTime : min),
          Infinity
        );

        // Check if smaller than any running job
        runningJobs.forEach((job) => {
          if (
            job &&
            jobQueue.length > 0 &&
            smallestInQueue < job.remainingTime
          ) {
            needPreemption = true;
          }
        });
      }

      // Decide if we need to do a reschedule
      if (
        needPreemption ||
        Math.abs(currentTime - nextScheduleTime) < 0.001 ||
        runningJobs.some((job) => job === null) ||
        completedJobFound ||
        currentTime === 0
      ) {
        shouldReschedule = true;
      }

      if (Math.abs(currentTime - nextScheduleTime) < 0.001) {
        nextScheduleTime = currentTime + 1.0;
      }
    }

    if (shouldReschedule) {
      // Return all unfinished jobs to queue for re-evaluation
      // But only if it's a full reschedule or if job preemption is needed
      if (!needRescheduleAfterCompletions || newJobArrived) {
        runningJobs.forEach((job, index) => {
          if (job && job.remainingTime > 0) {
            jobQueue.push(job);
            runningJobs[index] = null;
          }
        });
      }

      // Sort by remaining time (shortest first)
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

      // Assign shortest remaining time jobs to CPUs
      for (let i = 0; i < cpuCount && jobQueue.length > 0; i++) {
        if (runningJobs[i] === null) {
          const nextJob = jobQueue.shift();
          if (nextJob.startTime === -1) {
            nextJob.startTime = currentTime;
          }
          nextJob.lastExecutionTime = currentTime;
          runningJobs[i] = nextJob;
        }
      }
    }

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
