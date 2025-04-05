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
  let nextScheduleTime = 0.0;

  console.log("Starting SRTN scheduling with refined CPU prioritization");

  while (
    completedJobs < jobs.length ||
    runningJobs.some((job) => job !== null)
  ) {
    let newJobArrived = false;

    // Check for new arrivals
    jobs.forEach((job) => {
      if (
        Math.abs(job.arrivalTime - currentTime) < 0.001 &&
        job.remainingTime > 0 &&
        !jobQueue.includes(job) &&
        !runningJobs.includes(job)
      ) {
        console.log(`Time ${currentTime}: Job J${job.id} arrived.`);
        jobQueue.push(job);
        newJobArrived = true;
      }
    });

    // Check for completed jobs
    let jobCompletedThisStep = false;
    runningJobs.forEach((job, index) => {
      if (job && job.remainingTime <= 0.001) {
        console.log(
          `Time ${currentTime}: Job J${job.id} completed on CPU ${index}.`
        );
        jobCompletedThisStep = true;
        job.endTime = currentTime; // Completion time is current time
        job.turnaroundTime = job.endTime - job.arrivalTime;
        completedJobs++;
        runningJobs[index] = null;
      }
    });

    // Decide if preemption is needed due to a new shorter job
    let needPreemption = false;
    if (newJobArrived && jobQueue.length > 0) {
      const smallestInQueue = jobQueue.reduce(
        (min, job) => (job.remainingTime < min ? job.remainingTime : min),
        Infinity
      );
      runningJobs.forEach((job) => {
        if (job && smallestInQueue < job.remainingTime) {
          console.log(
            `Time ${currentTime}: Preemption needed. New job is shorter than running J${job.id}.`
          );
          needPreemption = true;
        }
      });
    }

    // Decide if we need to re-evaluate assignments
    const isScheduleInterval = Math.abs(currentTime - nextScheduleTime) < 0.001;
    const hasIdleCpu = runningJobs.some((j) => j === null);

    let shouldReassign = false;
    if (
      needPreemption ||
      jobCompletedThisStep ||
      (isScheduleInterval && hasIdleCpu) ||
      currentTime === 0
    ) {
      shouldReassign = true;
    }

    // Advance the 1-second interval marker
    if (isScheduleInterval) {
      nextScheduleTime = currentTime + 1.0;
    }

    if (shouldReassign) {
      console.log(
        `Time ${currentTime}: Reassigning jobs. Preemption: ${needPreemption}, Completion: ${jobCompletedThisStep}, Interval: ${isScheduleInterval}, Idle CPU: ${hasIdleCpu}`
      );
      // If preemption is needed, return all running jobs to queue
      if (needPreemption) {
        console.log(
          `Time ${currentTime}: Preemption detected, returning running jobs to queue.`
        );
        runningJobs.forEach((job, index) => {
          if (job) {
            // Only add non-null jobs
            jobQueue.push(job);
            runningJobs[index] = null;
          }
        });
      }
      // Note: Completed jobs are already set to null

      // Sort all available jobs (original queue + returned jobs)
      jobQueue.sort((a, b) => {
        if (Math.abs(a.remainingTime - b.remainingTime) < 0.001) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.remainingTime - b.remainingTime;
      });

      // Record queue state AFTER sorting and BEFORE assignment
      jobQueueHistory.push({
        time: currentTime,
        jobs: jobQueue.map((job) => ({
          id: job.id,
          remainingTime: parseFloat(job.remainingTime.toFixed(1)),
        })),
      });

      // Assign jobs using priority logic (CPU 0 first)
      const availableJobs = [...jobQueue];
      jobQueue.length = 0;

      // Fill CPU 0 first if idle
      if (runningJobs[0] === null && availableJobs.length > 0) {
        const shortestJob = availableJobs.shift(); // Takes the shortest
        if (shortestJob.startTime === -1) shortestJob.startTime = currentTime;
        runningJobs[0] = shortestJob;
        console.log(
          `Time ${currentTime}: Assigned J${
            shortestJob.id
          } (rem: ${shortestJob.remainingTime.toFixed(1)}) to CPU 0`
        );
      }
      // Fill other CPUs if idle
      for (let i = 1; i < cpuCount; i++) {
        if (runningJobs[i] === null && availableJobs.length > 0) {
          const nextJob = availableJobs.shift(); // Takes the next shortest
          if (nextJob.startTime === -1) nextJob.startTime = currentTime;
          runningJobs[i] = nextJob;
          console.log(
            `Time ${currentTime}: Assigned J${
              nextJob.id
            } (rem: ${nextJob.remainingTime.toFixed(1)}) to CPU ${i}`
          );
        }
      }
      jobQueue.push(...availableJobs); // Put back extras
    }

    // If no jobs are running and queue is empty, break the loop
    if (completedJobs >= jobs.length && !runningJobs.some((j) => j !== null)) {
      break;
    }

    // Process current time step only if there are jobs to process or in queue
    if (
      runningJobs.some((j) => j !== null) ||
      jobQueue.length > 0 ||
      jobs.some((j) => j.arrivalTime >= currentTime && j.remainingTime > 0)
    ) {
      runningJobs.forEach((job, cpuIndex) => {
        if (job !== null) {
          // Add history entry for the time step execution
          jobHistory.push({
            jobId: job.id,
            cpuId: cpuIndex,
            startTime: currentTime,
            endTime: currentTime + timeStep,
          });
          job.remainingTime -= timeStep;
        } else {
          // Add idle time entry if CPU is free
          jobHistory.push({
            jobId: "idle",
            cpuId: cpuIndex,
            startTime: currentTime,
            endTime: currentTime + timeStep,
          });
        }
      });
      currentTime += timeStep;
    } else {
      // If nothing to do, advance time slightly to check for future arrivals?
      // Or maybe just break if queue empty and no jobs running/arriving soon?
      // For now, let's just increment time if something might happen later
      const futureArrival = jobs.some((j) => j.arrivalTime > currentTime);
      if (futureArrival) {
        currentTime += timeStep; // Advance time to check arrivals later
      } else {
        break; // Nothing more will happen
      }
    }
  }
  console.log("Scheduling complete.");

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
