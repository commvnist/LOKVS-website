(() => {
  const yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const navLinks = document.querySelectorAll(".main-nav a");
  const currentPage = (window.location.pathname.split("/").pop() || "index.html") || "index.html";

  for (const link of navLinks) {
    if (link.getAttribute("href") !== currentPage) {
      continue;
    }

    link.classList.add("is-active");
    link.setAttribute("aria-current", "page");
  }

  const revealSections = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealSections.length > 0) {
    const observer = new IntersectionObserver(
      (entries, observerRef) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          entry.target.classList.add("is-visible");
          observerRef.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );

    for (const section of revealSections) {
      observer.observe(section);
    }
  } else {
    for (const section of revealSections) {
      section.classList.add("is-visible");
    }
  }

  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      const company = contactForm.organization?.value?.trim() || "Not provided";
      const name = contactForm.name?.value?.trim() || "Not provided";
      const email = contactForm.email?.value?.trim() || "Not provided";
      const phone = contactForm.phone?.value?.trim() || "Not provided";
      const audience = contactForm.audience?.value?.trim() || "Not provided";
      const platform = contactForm.platform?.value?.trim() || "Not provided";
      const useCase = contactForm.useCase?.value?.trim() || "Not provided";
      const stage = contactForm.stage?.value?.trim() || "Not provided";
      const constraints = contactForm.constraints?.value?.trim() || "None given";
      const notes = contactForm.notes?.value?.trim() || "None given";
      const body = [
        `Organization: ${company}`,
        `Contact: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Audience: ${audience}`,
        `Platform: ${platform}`,
        `Use case: ${useCase}`,
        `Stage: ${stage}`,
        "",
        `Technical constraints:`,
        constraints,
        "",
        "Additional notes:",
        notes,
      ].join("\n");

      const emailBody = encodeURIComponent(body);
      const subject = encodeURIComponent(`LOKVS Inquiry - ${audience} / ${useCase}`);
      const href = `mailto:hello@lokvs.com?subject=${subject}&body=${emailBody}`;

      event.preventDefault();
      window.location.href = href;
    });
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("topologyCanvas");
  if (!canvas || prefersReducedMotion) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const formationButtons = document.querySelectorAll(".formation-chip");
  let selectedFormation = "auto";

  const drones = [];
  const droneCount = 6;
  const formationDuration = 7.5;
  const formationStates = [
    {
      name: "perimeter",
      label: "Defense perimeter",
      offsets: [
        { x: -14, y: 10, z: 1.0 },
        { x: 14, y: 10, z: 1.4 },
        { x: -28, y: 22, z: 2.0 },
        { x: 0, y: 32, z: 2.8 },
        { x: 28, y: 22, z: 2.0 },
      ],
    },
    {
      name: "response",
      label: "Search response",
      offsets: [
        { x: -42, y: 6, z: 0.8 },
        { x: 42, y: 6, z: 0.8 },
        { x: 0, y: 16, z: 3.7 },
        { x: -20, y: 30, z: 1.8 },
        { x: 20, y: 30, z: 1.8 },
      ],
    },
    {
      name: "inspection",
      label: "Industrial inspection",
      offsets: [
        { x: -10, y: 11, z: 1.0 },
        { x: 12, y: 12, z: 2.0 },
        { x: -12, y: 24, z: 3.1 },
        { x: 14, y: 26, z: 4.2 },
        { x: 2, y: 38, z: 5.4 },
      ],
    },
  ];
  const meshLinks = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [3, 4],
    [4, 5],
  ];
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  let lastSimTime = 0;
  let activeFormationTransition = {
    fromOffsets: formationStates[0].offsets.map((offset) => ({ ...offset })),
    toFormation: formationStates[0],
    startedAt: 0,
    duration: 2.4,
  };

  const lerp = (start, end, amount) => start + (end - start) * amount;
  const smoothStep = (value) => value * value * (3 - 2 * value);
  const formatMeters = (value) => `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}`;
  const cloneOffsets = (offsets) => offsets.map((offset) => ({ ...offset }));
  const interpolateOffsets = (fromOffsets, toOffsets, mix) =>
    fromOffsets.map((offset, index) => ({
      x: lerp(offset.x, toOffsets[index].x, mix),
      y: lerp(offset.y, toOffsets[index].y, mix),
      z: lerp(offset.z, toOffsets[index].z, mix),
    }));

  const configureCanvas = () => {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.floor(bounds.width * dpr);
    canvas.height = Math.floor(bounds.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawRoundedRect = (x, y, rectWidth, rectHeight, radius) => {
    const safeRadius = Math.min(radius, rectWidth * 0.5, rectHeight * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.lineTo(x + rectWidth - safeRadius, y);
    ctx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + safeRadius);
    ctx.lineTo(x + rectWidth, y + rectHeight - safeRadius);
    ctx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - safeRadius, y + rectHeight);
    ctx.lineTo(x + safeRadius, y + rectHeight);
    ctx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - safeRadius);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
    ctx.closePath();
  };

  const projectPoint = (point) => {
    const scale = Math.min(width, height) * 0.019;
    return {
      x: width * 0.44 + point.x * scale * 0.94 + point.y * scale * 0.28,
      y: height * 0.72 + point.y * scale * 0.26 - point.z * scale * 0.64,
    };
  };

  const getAutoFormationContext = (time) => {
    const baseIndex = Math.floor(time / formationDuration) % formationStates.length;
    const nextIndex = (baseIndex + 1) % formationStates.length;
    const mix = smoothStep((time % formationDuration) / formationDuration);
    return {
      current: formationStates[baseIndex],
      next: formationStates[nextIndex],
      mix,
      offsets: interpolateOffsets(
        formationStates[baseIndex].offsets,
        formationStates[nextIndex].offsets,
        mix
      ),
      autopilotStatus: "adaptive",
    };
  };

  const getManualFormationContext = (time) => {
    const progress = Math.min(1, Math.max(0, (time - activeFormationTransition.startedAt) / activeFormationTransition.duration));
    const mix = smoothStep(progress);

    return {
      current: activeFormationTransition.toFormation,
      next: activeFormationTransition.toFormation,
      mix,
      offsets: interpolateOffsets(
        activeFormationTransition.fromOffsets,
        activeFormationTransition.toFormation.offsets,
        mix
      ),
      autopilotStatus: progress < 1 ? "reconfiguring" : "locked",
    };
  };

  const getCurrentFormationContext = (time) => {
    if (selectedFormation === "auto") {
      return getAutoFormationContext(time);
    }

    return getManualFormationContext(time);
  };

  const syncFormationButtons = () => {
    for (const button of formationButtons) {
      const isActive = button.dataset.formation === selectedFormation;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  };

  for (const button of formationButtons) {
    button.addEventListener("click", () => {
      const nextFormation = button.dataset.formation || "auto";
      if (nextFormation === selectedFormation) {
        return;
      }

      const currentContext = getCurrentFormationContext(lastSimTime);
      selectedFormation = nextFormation;

      if (selectedFormation !== "auto") {
        const targetFormation = formationStates.find((state) => state.name === selectedFormation) || formationStates[0];
        activeFormationTransition = {
          fromOffsets: cloneOffsets(currentContext.offsets),
          toFormation: targetFormation,
          startedAt: lastSimTime,
          duration: 2.8,
        };
      }

      syncFormationButtons();
    });
  }

  syncFormationButtons();

  const createDrones = () => {
    drones.length = 0;
    for (let i = 0; i < droneCount; i++) {
      drones.push({
        id: `D-0${i + 1}`,
        leader: i === 0,
        position: { x: 0, y: 0, z: 8.6 },
        target: { x: 0, y: 0, z: 8.6 },
        heading: 0,
        trail: [],
      });
    }
  };

  const updateDrones = (time) => {
    const leader = drones[0];
    const formation = getCurrentFormationContext(time);
    const scenarioName = formation.current.name;

    if (scenarioName === "perimeter") {
      leader.target.x = Math.sin(time * 0.36) * 9 + Math.cos(time * 0.14) * 3;
      leader.target.y = Math.cos(time * 0.18) * 6 + Math.sin(time * 0.11) * 2.5;
      leader.target.z = 8.9 + Math.sin(time * 0.56) * 0.55;
    } else if (scenarioName === "response") {
      leader.target.x = Math.sin(time * 0.24) * 21 + Math.sin(time * 0.58) * 3.5;
      leader.target.y = Math.cos(time * 0.16) * 2.8 + Math.sin(time * 0.1) * 1.4;
      leader.target.z = 8.5 + Math.cos(time * 0.42) * 0.35;
    } else {
      leader.target.x = Math.sin(time * 0.2) * 3.8 + Math.cos(time * 0.11) * 1.6;
      leader.target.y = Math.cos(time * 0.24) * 9.5 + Math.sin(time * 0.13) * 2.6;
      leader.target.z = 8.9 + Math.sin(time * 0.5) * 0.8;
    }

    for (let i = 1; i < drones.length; i++) {
      const offset = formation.offsets[i - 1];

      drones[i].target.x = leader.target.x + offset.x + Math.sin(time * 0.55 + i) * 0.38;
      drones[i].target.y = leader.target.y + offset.y + Math.cos(time * 0.45 + i * 0.4) * 0.42;
      drones[i].target.z = leader.target.z + offset.z + Math.sin(time * 0.72 + i * 0.35) * 0.2;
    }

    for (const drone of drones) {
      const speed = drone.leader ? 0.055 : 0.085;
      drone.position.x = lerp(drone.position.x, drone.target.x, speed);
      drone.position.y = lerp(drone.position.y, drone.target.y, speed);
      drone.position.z = lerp(drone.position.z, drone.target.z, speed);

      const desiredHeading = Math.atan2(drone.target.y - drone.position.y, drone.target.x - drone.position.x);
      let delta = desiredHeading - drone.heading;
      if (delta > Math.PI) {
        delta -= Math.PI * 2;
      } else if (delta < -Math.PI) {
        delta += Math.PI * 2;
      }
      drone.heading += delta * 0.12;

      drone.trail.push({ x: drone.position.x, y: drone.position.y, z: 0 });
      if (drone.trail.length > 56) {
        drone.trail.shift();
      }
    }

    return formation;
  };

  const drawBackdrop = (time) => {
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#101722");
    background.addColorStop(0.55, "#0b1118");
    background.addColorStop(1, "#0a0e15");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const pulse = 0.08 + (Math.sin(time * 0.45) * 0.5 + 0.5) * 0.08;

    for (let x = -120; x <= 120; x += 12) {
      const start = projectPoint({ x, y: -74, z: 0 });
      const end = projectPoint({ x, y: 82, z: 0 });
      ctx.strokeStyle = `rgba(76, 92, 118, ${x % 24 === 0 ? 0.22 : 0.12 + pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    for (let y = -74; y <= 82; y += 12) {
      const start = projectPoint({ x: -120, y, z: 0 });
      const end = projectPoint({ x: 120, y, z: 0 });
      ctx.strokeStyle = `rgba(41, 54, 71, ${y % 24 === 0 ? 0.28 : 0.12})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    const corridorStart = projectPoint({ x: -64, y: -8, z: 0 });
    const corridorEnd = projectPoint({ x: 76, y: 48, z: 0 });
    ctx.strokeStyle = "rgba(75, 165, 255, 0.13)";
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(corridorStart.x, corridorStart.y);
    ctx.quadraticCurveTo(width * 0.52, height * 0.6, corridorEnd.x, corridorEnd.y);
    ctx.stroke();
  };

  const drawTrails = () => {
    for (const drone of drones) {
      if (drone.trail.length < 2) {
        continue;
      }

      ctx.beginPath();
      for (let i = 0; i < drone.trail.length; i++) {
        const point = projectPoint(drone.trail[i]);
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.strokeStyle = drone.leader ? "rgba(125, 196, 255, 0.18)" : "rgba(75, 165, 255, 0.09)";
      ctx.lineWidth = drone.leader ? 1.8 : 1.2;
      ctx.stroke();
    }
  };

  const drawFormationGuides = (formation) => {
    const leaderTarget = projectPoint(drones[0].target);
    const targetPoints = [leaderTarget];

    for (let i = 1; i < drones.length; i++) {
      targetPoints.push(projectPoint(drones[i].target));
    }

    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(157, 173, 193, 0.2)";
    ctx.lineWidth = 1;

    for (const [startIndex, endIndex] of meshLinks) {
      const start = targetPoints[startIndex];
      const end = targetPoints[endIndex];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.restore();

    ctx.fillStyle = "rgba(163, 180, 197, 0.18)";
    for (let i = 1; i < drones.length; i++) {
      const point = targetPoints[i];
      ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    }
  };

  const drawMeshOverview = (time) => {
    const panelWidth = Math.min(184, width * 0.3);
    const panelHeight = 118;
    const panelX = 16;
    const panelY = 16;
    const centerX = panelX + panelWidth * 0.5;
    const centerY = panelY + 68;
    const angle = time * 0.24;
    const overviewRange = 64;
    const overviewScale = Math.min(panelWidth * 0.26, 42);
    const leader = drones[0];
    const points = [];

    drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fillStyle = "rgba(10, 15, 22, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(75, 165, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '600 10px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#d6e7f9";
    ctx.fillText("TOP VIEW / RELATIVE MESH", panelX + 12, panelY + 18);

    ctx.strokeStyle = "rgba(69, 92, 119, 0.22)";
    ctx.lineWidth = 1;
    for (const radius of [18, 31, 44]) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(centerX - 52, centerY);
    ctx.lineTo(centerX + 52, centerY);
    ctx.moveTo(centerX, centerY - 42);
    ctx.lineTo(centerX, centerY + 42);
    ctx.stroke();

    for (const drone of drones) {
      const relativeX = drone.position.x - leader.position.x;
      const relativeY = drone.position.y - leader.position.y;
      const rotatedX = relativeX * Math.cos(angle) - relativeY * Math.sin(angle);
      const rotatedY = relativeX * Math.sin(angle) + relativeY * Math.cos(angle);

      points.push({
        leader: drone.leader,
        id: drone.id,
        z: drone.position.z - leader.position.z,
        x: centerX + (rotatedX / overviewRange) * overviewScale,
        y: centerY + (rotatedY / overviewRange) * overviewScale * 0.9,
      });
    }

    for (const [startIndex, endIndex] of meshLinks) {
      const start = points[startIndex];
      const end = points[endIndex];
      ctx.strokeStyle = start.leader || end.leader ? "rgba(108, 186, 255, 0.48)" : "rgba(75, 165, 255, 0.18)";
      ctx.lineWidth = start.leader || end.leader ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    for (const point of points) {
      ctx.fillStyle = point.leader ? "#a7dbff" : "#4ba5ff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.leader ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawMeshLinks = (time) => {
    for (let i = 0; i < meshLinks.length; i++) {
      const [startIndex, endIndex] = meshLinks[i];
      const startDrone = drones[startIndex];
      const endDrone = drones[endIndex];
      const start = projectPoint(startDrone.position);
      const end = projectPoint(endDrone.position);
      const range = Math.hypot(
        startDrone.position.x - endDrone.position.x,
        startDrone.position.y - endDrone.position.y,
        startDrone.position.z - endDrone.position.z
      );

      ctx.strokeStyle = startIndex === 0 || endIndex === 0 ? "rgba(108, 186, 255, 0.5)" : "rgba(75, 165, 255, 0.2)";
      ctx.lineWidth = startIndex === 0 || endIndex === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const packetPosition = (time * 0.38 + i * 0.16) % 1;
      const packet = {
        x: lerp(start.x, end.x, packetPosition),
        y: lerp(start.y, end.y, packetPosition),
      };
      ctx.fillStyle = "rgba(199, 231, 255, 0.92)";
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, 2.4, 0, Math.PI * 2);
      ctx.fill();

      if (startIndex === 0) {
        const mid = {
          x: lerp(start.x, end.x, 0.52),
          y: lerp(start.y, end.y, 0.52),
        };
        const label = `${range.toFixed(1)}m`;
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        const labelWidth = ctx.measureText(label).width + 10;
        drawRoundedRect(mid.x - labelWidth * 0.5, mid.y - 10, labelWidth, 16, 5);
        ctx.fillStyle = "rgba(11, 17, 24, 0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(75, 165, 255, 0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#d4e7fb";
        ctx.fillText(label, mid.x - labelWidth * 0.5 + 5, mid.y + 1);
      }
    }
  };

  const drawDrone = (drone) => {
    const groundPoint = projectPoint({ x: drone.position.x, y: drone.position.y, z: 0 });
    const airPoint = projectPoint(drone.position);

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(groundPoint.x, groundPoint.y + 3, 14, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(102, 127, 156, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(groundPoint.x, groundPoint.y);
    ctx.lineTo(airPoint.x, airPoint.y);
    ctx.stroke();

    ctx.save();
    ctx.translate(airPoint.x, airPoint.y);
    ctx.rotate(drone.heading);

    ctx.strokeStyle = "#9fb3c7";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(11, 0);
    ctx.moveTo(0, -11);
    ctx.lineTo(0, 11);
    ctx.stroke();

    ctx.fillStyle = "#0c131b";
    ctx.strokeStyle = drone.leader ? "#7bc4ff" : "#6daee6";
    ctx.lineWidth = 1.1;
    ctx.fillRect(-5.2, -5.2, 10.4, 10.4);
    ctx.strokeRect(-5.2, -5.2, 10.4, 10.4);

    ctx.fillStyle = drone.leader ? "#8fd0ff" : "#4ba5ff";
    ctx.fillRect(-2.4, -2.4, 4.8, 4.8);

    const rotorOffsets = [
      [-11, 0],
      [11, 0],
      [0, -11],
      [0, 11],
    ];

    for (const [x, y] of rotorOffsets) {
      ctx.strokeStyle = "rgba(199, 216, 233, 0.55)";
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (drone.leader) {
      ctx.strokeStyle = "rgba(123, 196, 255, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    ctx.font = '600 10px "IBM Plex Mono", monospace';
    const labelWidth = ctx.measureText(drone.id).width + 12;
    drawRoundedRect(airPoint.x + 11, airPoint.y - 17, labelWidth, 16, 5);
    ctx.fillStyle = "rgba(12, 18, 25, 0.86)";
    ctx.fill();
    ctx.strokeStyle = drone.leader ? "rgba(123, 196, 255, 0.42)" : "rgba(75, 165, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#d9e8f8";
    ctx.fillText(drone.id, airPoint.x + 17, airPoint.y - 6);
  };

  const drawTelemetryPanel = (formation) => {
    const leader = drones[0];
    const panelWidth = Math.min(336, width * 0.54);
    const panelHeight = 210;
    const panelX = width - panelWidth - 16;
    const panelY = width > 620 ? height - panelHeight - 18 : 18;
    const compact = panelWidth < 250;
    const paddingX = 14;
    const labelColumn = panelX + paddingX;
    const valueColumn = panelX + panelWidth * (compact ? 0.44 : 0.46);
    const zColumn = panelX + panelWidth - paddingX;
    const yColumn = zColumn - (compact ? 50 : 56);
    const xColumn = yColumn - (compact ? 50 : 56);
    const metaRows = [
      ["mesh mode", "coordinated"],
      ["scenario", selectedFormation === "auto" ? "auto cycle" : formation.current.label],
      ["node type", compact ? "LOKVS UWB mesh" : "LOKVS UWB module"],
      ["autopilot", formation.autopilotStatus],
    ];

    drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fillStyle = "rgba(10, 15, 22, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(75, 165, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `600 ${compact ? 10 : 11}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "#d6e7f9";
    ctx.textAlign = "left";
    ctx.fillText("UWB RELATIVE 3D STATE", labelColumn, panelY + 20);

    ctx.font = `500 ${compact ? 9 : 10}px "IBM Plex Mono", monospace`;
    for (let i = 0; i < metaRows.length; i++) {
      const [label, value] = metaRows[i];
      const rowY = panelY + 38 + i * 16;
      ctx.fillStyle = "#8eb6df";
      ctx.fillText(label, labelColumn, rowY);
      ctx.fillStyle = "#d6e7f9";
      ctx.fillText(value, valueColumn, rowY);
    }

    ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
    ctx.fillRect(labelColumn, panelY + 104, panelWidth - paddingX * 2, 1);

    ctx.fillStyle = "#7bc4ff";
    ctx.textAlign = "left";
    ctx.fillText("ID", labelColumn, panelY + 122);
    ctx.textAlign = "right";
    ctx.fillText("X", xColumn, panelY + 122);
    ctx.fillText("Y", yColumn, panelY + 122);
    ctx.fillText("Z", zColumn, panelY + 122);

    ctx.fillStyle = "#d6e7f9";
    for (let i = 1; i < drones.length; i++) {
      const drone = drones[i];
      const rowY = panelY + 138 + (i - 1) * 14;
      const relative = {
        x: drone.position.x - leader.position.x,
        y: drone.position.y - leader.position.y,
        z: drone.position.z - leader.position.z,
      };

      ctx.textAlign = "left";
      ctx.fillText(drone.id, labelColumn, rowY);
      ctx.textAlign = "right";
      ctx.fillText(formatMeters(relative.x), xColumn, rowY);
      ctx.fillText(formatMeters(relative.y), yColumn, rowY);
      ctx.fillText(formatMeters(relative.z), zColumn, rowY);
    }

    ctx.textAlign = "left";
  };

  const draw = (frameTime) => {
    if (prefersReducedMotion) {
      return;
    }

    const time = frameTime * 0.001;
    lastSimTime = time;
    const formation = updateDrones(time);

    ctx.clearRect(0, 0, width, height);
    drawBackdrop(time);
    drawMeshOverview(time);
    drawTrails();
    drawFormationGuides(formation);
    drawMeshLinks(time);

    const sortedDrones = [...drones].sort((a, b) => a.position.y - b.position.y);
    for (const drone of sortedDrones) {
      drawDrone(drone);
    }

    drawTelemetryPanel(formation);

    requestAnimationFrame(draw);
  };

  configureCanvas();
  createDrones();
  requestAnimationFrame(draw);

  window.addEventListener("resize", () => {
    configureCanvas();
    for (const drone of drones) {
      drone.trail = [];
    }
  });
})();
