(() => {
  const yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const navLinks = document.querySelectorAll(".main-nav a");
  const currentPage = (window.location.pathname.split("/").pop() || "index.html") || "index.html";
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.getElementById("primary-navigation");

  if (navToggle && mainNav) {
    const closeNav = () => {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    };

    const openNav = () => {
      document.body.classList.add("nav-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close navigation");
    };

    navToggle.addEventListener("click", () => {
      if (document.body.classList.contains("nav-open")) {
        closeNav();
        return;
      }

      openNav();
    });

    mainNav.addEventListener("click", (event) => {
      if (!event.target.closest("a")) {
        return;
      }

      closeNav();
    });

    document.addEventListener("click", (event) => {
      if (!document.body.classList.contains("nav-open")) {
        return;
      }

      if (mainNav.contains(event.target) || navToggle.contains(event.target)) {
        return;
      }

      closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      closeNav();
    });

    const desktopMediaQuery = window.matchMedia("(min-width: 761px)");
    const syncNavWithViewport = (event) => {
      if (!event.matches) {
        return;
      }

      closeNav();
    };

    if (typeof desktopMediaQuery.addEventListener === "function") {
      desktopMediaQuery.addEventListener("change", syncNavWithViewport);
    } else if (typeof desktopMediaQuery.addListener === "function") {
      desktopMediaQuery.addListener(syncNavWithViewport);
    }
  }

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
  const overviewCanvas = document.getElementById("meshOverviewCanvas");
  if (!canvas || !overviewCanvas || prefersReducedMotion) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const overviewCtx = overviewCanvas.getContext("2d");
  if (!ctx || !overviewCtx) {
    return;
  }

  const formationButtons = [...document.querySelectorAll(".formation-chip")];
  const telemetryPanel = document.querySelector(".telemetry-panel");
  let selectedFormation = "auto";

  const telemetry = telemetryPanel
    ? {
        meshMode: telemetryPanel.querySelector("[data-telemetry-mesh-mode]"),
        scenario: telemetryPanel.querySelector("[data-telemetry-scenario]"),
        nodeType: telemetryPanel.querySelector("[data-telemetry-node-type]"),
        autopilot: telemetryPanel.querySelector("[data-telemetry-autopilot]"),
        rows: new Map(
          [...telemetryPanel.querySelectorAll("[data-telemetry-row]")].map((row) => [
            row.dataset.telemetryRow,
            {
              x: row.querySelector('[data-axis="x"]'),
              y: row.querySelector('[data-axis="y"]'),
              z: row.querySelector('[data-axis="z"]'),
            },
          ])
        ),
      }
    : null;

  const formations = [
    {
      name: "perimeter",
      label: "Defense perimeter",
      telemetryLabel: "Defense",
      offsets: [
        { x: -14, y: 9, z: 1.0 },
        { x: 14, y: 9, z: 1.2 },
        { x: -28, y: 21, z: 2.0 },
        { x: 0, y: 30, z: 2.8 },
        { x: 28, y: 21, z: 2.0 },
      ],
    },
    {
      name: "response",
      label: "Search response",
      telemetryLabel: "Response",
      offsets: [
        { x: -42, y: 6, z: 0.9 },
        { x: 42, y: 6, z: 0.9 },
        { x: 0, y: 16, z: 4.0 },
        { x: -22, y: 30, z: 1.8 },
        { x: 22, y: 30, z: 1.8 },
      ],
    },
    {
      name: "inspection",
      label: "Industrial inspection",
      telemetryLabel: "Inspection",
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
  const formationLookup = new Map(formations.map((formation) => [formation.name, formation]));
  const drones = Array.from({ length: 6 }, (_, index) => ({
    id: `D-0${index + 1}`,
    leader: index === 0,
    position: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    heading: 0,
    trail: [],
  }));

  const viewState = {
    yaw: -0.62,
    pitch: 0.72,
    zoom: 1,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  };

  let width = 0;
  let height = 0;
  let overviewWidth = 0;
  let overviewHeight = 0;
  let lastFrameTime = 0;
  let lastSimTime = 0;
  let activeFormationName = "perimeter";
  let lastFormationChangeTime = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const formatMeters = (value) => `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}`;
  const distanceBetween = (first, second) =>
    Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
  const approachNumber = (current, target, rate, deltaTime) =>
    current + (target - current) * (1 - Math.exp(-rate * deltaTime));
  const approachPoint = (point, target, rate, deltaTime) => {
    point.x = approachNumber(point.x, target.x, rate, deltaTime);
    point.y = approachNumber(point.y, target.y, rate, deltaTime);
    point.z = approachNumber(point.z, target.z, rate, deltaTime);
  };

  const resizeCanvasToDisplaySize = (canvasNode, contextRef) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvasNode.getBoundingClientRect();
    canvasNode.width = Math.max(1, Math.round(bounds.width * dpr));
    canvasNode.height = Math.max(1, Math.round(bounds.height * dpr));
    contextRef.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: bounds.width, height: bounds.height };
  };

  const configureCanvases = () => {
    const mainSize = resizeCanvasToDisplaySize(canvas, ctx);
    width = mainSize.width;
    height = mainSize.height;

    const overviewSize = resizeCanvasToDisplaySize(overviewCanvas, overviewCtx);
    overviewWidth = overviewSize.width;
    overviewHeight = overviewSize.height;
  };

  const setFormationButtons = (value) => {
    for (const button of formationButtons) {
      const isActive = button.dataset.formation === value;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  };

  const getAutoFormationName = (time) => formations[Math.floor(time / 8) % formations.length].name;

  const getLeaderTarget = (formationName, time) => {
    if (formationName === "perimeter") {
      return {
        x: Math.sin(time * 0.36) * 12 + Math.cos(time * 0.14) * 3,
        y: 16 + Math.cos(time * 0.24) * 6,
        z: 8.8 + Math.sin(time * 0.52) * 0.45,
      };
    }

    if (formationName === "response") {
      return {
        x: Math.sin(time * 0.24) * 22 + Math.sin(time * 0.58) * 3.5,
        y: 13 + Math.cos(time * 0.16) * 3,
        z: 8.5 + Math.cos(time * 0.34) * 0.38,
      };
    }

    return {
      x: Math.sin(time * 0.18) * 4 + Math.cos(time * 0.11) * 1.6,
      y: 10 + Math.cos(time * 0.24) * 9.5,
      z: 8.9 + Math.sin(time * 0.5) * 0.7,
    };
  };

  const initializeDrones = () => {
    const startingFormation = formationLookup.get("perimeter");
    const leaderTarget = getLeaderTarget("perimeter", 0);
    const leader = drones[0];
    leader.position = { ...leaderTarget };
    leader.target = { ...leaderTarget };

    for (let index = 1; index < drones.length; index += 1) {
      const offset = startingFormation.offsets[index - 1];
      const position = {
        x: leaderTarget.x + offset.x,
        y: leaderTarget.y + offset.y,
        z: leaderTarget.z + offset.z,
      };
      drones[index].position = { ...position };
      drones[index].target = { ...position };
    }
  };

  const getSceneCenter = () => {
    const leader = drones[0];

    return {
      x: leader.position.x,
      y: leader.position.y,
      z: leader.position.z,
    };
  };

  const projectPoint = (point, center) => {
    const localX = point.x - center.x;
    const localY = point.y - center.y;
    const localZ = point.z - center.z;

    const cosYaw = Math.cos(viewState.yaw);
    const sinYaw = Math.sin(viewState.yaw);
    const rotatedX = localX * cosYaw - localY * sinYaw;
    const rotatedY = localX * sinYaw + localY * cosYaw;

    const cosPitch = Math.cos(viewState.pitch);
    const sinPitch = Math.sin(viewState.pitch);
    const depth = rotatedY * cosPitch - localZ * sinPitch + 92;
    const elevated = rotatedY * sinPitch + localZ * cosPitch;
    const perspective = (26 * viewState.zoom) / Math.max(depth, 14);

    return {
      x: width * 0.5 + rotatedX * perspective * 18,
      y: height * 0.68 - elevated * perspective * 18,
      depth,
      scale: perspective,
      visible: depth > 0,
    };
  };

  const drawLine3D = (first, second, center, strokeStyle, lineWidth) => {
    const start = projectPoint(first, center);
    const end = projectPoint(second, center);
    if (!start.visible || !end.visible) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  };

  const drawGroundBand = (corners, center) => {
    const projected = corners.map((corner) => projectPoint(corner, center));
    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    for (let index = 1; index < projected.length; index += 1) {
      ctx.lineTo(projected[index].x, projected[index].y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(75, 165, 255, 0.12)";
    ctx.fill();
  };

  const getActiveFormation = (time) => {
    const nextFormationName = selectedFormation === "auto" ? getAutoFormationName(time) : selectedFormation;
    if (nextFormationName !== activeFormationName) {
      activeFormationName = nextFormationName;
      lastFormationChangeTime = time;
    }

    return formationLookup.get(activeFormationName) || formations[0];
  };

  const updateDrones = (time, deltaTime) => {
    const formation = getActiveFormation(time);
    const leader = drones[0];
    const leaderTarget = getLeaderTarget(formation.name, time);

    leader.target = { ...leaderTarget };
    approachPoint(leader.position, leader.target, 2.3, deltaTime);

    let accumulatedError = 0;
    for (let index = 1; index < drones.length; index += 1) {
      const offset = formation.offsets[index - 1];
      const drone = drones[index];
      drone.target = {
        x: leader.target.x + offset.x + Math.sin(time * 0.55 + index) * 0.32,
        y: leader.target.y + offset.y + Math.cos(time * 0.45 + index * 0.4) * 0.38,
        z: leader.target.z + offset.z + Math.sin(time * 0.72 + index * 0.35) * 0.16,
      };

      approachPoint(drone.position, drone.target, 2.7, deltaTime);
      const desiredHeading = Math.atan2(drone.target.y - drone.position.y, drone.target.x - drone.position.x);
      let deltaHeading = desiredHeading - drone.heading;
      if (deltaHeading > Math.PI) {
        deltaHeading -= Math.PI * 2;
      } else if (deltaHeading < -Math.PI) {
        deltaHeading += Math.PI * 2;
      }
      drone.heading += deltaHeading * 0.12;
      accumulatedError += distanceBetween(drone.position, drone.target);
    }

    leader.heading = Math.atan2(leader.target.y - leader.position.y, leader.target.x - leader.position.x);

    for (const drone of drones) {
      drone.trail.push({ x: drone.position.x, y: drone.position.y, z: 0 });
      if (drone.trail.length > 48) {
        drone.trail.shift();
      }
    }

    const averageError = accumulatedError / Math.max(1, drones.length - 1);
    return {
      current: formation,
      autopilotStatus: averageError > 1.2 || time - lastFormationChangeTime < 1.2 ? "reconfiguring" : "locked",
    };
  };

  const drawBackdrop = (center) => {
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#101722");
    background.addColorStop(0.55, "#0b1118");
    background.addColorStop(1, "#0a0e15");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const leader = drones[0];
    let maxRelativeX = 0;
    let maxRelativeY = 0;
    for (const drone of drones) {
      maxRelativeX = Math.max(maxRelativeX, Math.abs(drone.position.x - leader.position.x));
      maxRelativeY = Math.max(maxRelativeY, Math.abs(drone.position.y - leader.position.y));
    }

    const platformHalfWidth = Math.max(76, maxRelativeX * 1.35 + 26);
    const platformHalfDepth = Math.max(74, maxRelativeY * 1.28 + 34);

    drawGroundBand(
      [
        { x: center.x - platformHalfWidth, y: center.y - platformHalfDepth, z: 0 },
        { x: center.x + platformHalfWidth, y: center.y - platformHalfDepth, z: 0 },
        { x: center.x + platformHalfWidth, y: center.y + platformHalfDepth, z: 0 },
        { x: center.x - platformHalfWidth, y: center.y + platformHalfDepth, z: 0 },
      ],
      center
    );

    for (let x = -platformHalfWidth; x <= platformHalfWidth; x += 12) {
      drawLine3D(
        { x: center.x + x, y: center.y - platformHalfDepth, z: 0 },
        { x: center.x + x, y: center.y + platformHalfDepth, z: 0 },
        center,
        `rgba(76, 92, 118, ${x % 24 === 0 ? 0.24 : 0.14})`,
        1
      );
    }

    for (let y = -platformHalfDepth; y <= platformHalfDepth; y += 12) {
      drawLine3D(
        { x: center.x - platformHalfWidth, y: center.y + y, z: 0 },
        { x: center.x + platformHalfWidth, y: center.y + y, z: 0 },
        center,
        `rgba(41, 54, 71, ${y % 24 === 0 ? 0.28 : 0.12})`,
        1
      );
    }
  };

  const drawTrails = (center) => {
    for (const drone of drones) {
      if (drone.trail.length < 2) {
        continue;
      }

      ctx.beginPath();
      for (let index = 0; index < drone.trail.length; index += 1) {
        const projected = projectPoint(drone.trail[index], center);
        if (index === 0) {
          ctx.moveTo(projected.x, projected.y);
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }
      ctx.strokeStyle = drone.leader ? "rgba(125, 196, 255, 0.18)" : "rgba(75, 165, 255, 0.09)";
      ctx.lineWidth = drone.leader ? 1.8 : 1.2;
      ctx.stroke();
    }
  };

  const drawMeshLinks = (center) => {
    for (let index = 0; index < meshLinks.length; index += 1) {
      const [startIndex, endIndex] = meshLinks[index];
      const startDrone = drones[startIndex];
      const endDrone = drones[endIndex];
      const range = distanceBetween(startDrone.position, endDrone.position);
      if (range > 74) {
        continue;
      }

      const alpha = 0.14 + (1 - range / 74) * 0.28;
      drawLine3D(
        startDrone.position,
        endDrone.position,
        center,
        startIndex === 0 || endIndex === 0 ? `rgba(108, 186, 255, ${alpha.toFixed(3)})` : `rgba(75, 165, 255, ${(alpha * 0.55).toFixed(3)})`,
        startIndex === 0 || endIndex === 0 ? 1.6 : 1
      );
    }
  };

  const drawDrone = (drone, center, projection) => {
    const airPoint = projection || projectPoint(drone.position, center);
    const groundPoint = projectPoint({ x: drone.position.x, y: drone.position.y, z: 0 }, center);
    const bodyRadius = clamp(airPoint.scale * 10 + 4.2, 4.6, 9.2);
    const armLength = bodyRadius * 1.45;

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(groundPoint.x, groundPoint.y + 3, bodyRadius * 1.45, bodyRadius * 0.5, 0, 0, Math.PI * 2);
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
    ctx.moveTo(-armLength, 0);
    ctx.lineTo(armLength, 0);
    ctx.moveTo(0, -armLength);
    ctx.lineTo(0, armLength);
    ctx.stroke();

    ctx.fillStyle = "#0c131b";
    ctx.strokeStyle = drone.leader ? "#7bc4ff" : "#6daee6";
    ctx.lineWidth = 1.1;
    ctx.fillRect(-bodyRadius, -bodyRadius, bodyRadius * 2, bodyRadius * 2);
    ctx.strokeRect(-bodyRadius, -bodyRadius, bodyRadius * 2, bodyRadius * 2);

    ctx.fillStyle = drone.leader ? "#8fd0ff" : "#4ba5ff";
    ctx.fillRect(-bodyRadius * 0.45, -bodyRadius * 0.45, bodyRadius * 0.9, bodyRadius * 0.9);

    const rotorOffset = armLength;
    const rotorRadius = bodyRadius * 0.45;
    for (const [offsetX, offsetY] of [
      [-rotorOffset, 0],
      [rotorOffset, 0],
      [0, -rotorOffset],
      [0, rotorOffset],
    ]) {
      ctx.strokeStyle = "rgba(199, 216, 233, 0.55)";
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, rotorRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (drone.leader) {
      ctx.strokeStyle = "rgba(123, 196, 255, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, bodyRadius * 2.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.font = '600 10px "IBM Plex Mono", monospace';
    const labelWidth = ctx.measureText(drone.id).width + 12;
    const labelX = airPoint.x + bodyRadius + 8;
    const labelY = airPoint.y - 18;
    ctx.beginPath();
    ctx.moveTo(labelX + 5, labelY);
    ctx.lineTo(labelX + labelWidth - 5, labelY);
    ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + 5);
    ctx.lineTo(labelX + labelWidth, labelY + 11);
    ctx.quadraticCurveTo(labelX + labelWidth, labelY + 16, labelX + labelWidth - 5, labelY + 16);
    ctx.lineTo(labelX + 5, labelY + 16);
    ctx.quadraticCurveTo(labelX, labelY + 16, labelX, labelY + 11);
    ctx.lineTo(labelX, labelY + 5);
    ctx.quadraticCurveTo(labelX, labelY, labelX + 5, labelY);
    ctx.closePath();
    ctx.fillStyle = "rgba(12, 18, 25, 0.86)";
    ctx.fill();
    ctx.strokeStyle = drone.leader ? "rgba(123, 196, 255, 0.42)" : "rgba(75, 165, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#d9e8f8";
    ctx.fillText(drone.id, labelX + 6, labelY + 11);
  };

  const drawOverview = () => {
    overviewCtx.clearRect(0, 0, overviewWidth, overviewHeight);
    overviewCtx.fillStyle = "#0c1218";
    overviewCtx.fillRect(0, 0, overviewWidth, overviewHeight);

    const leader = drones[0];
    const centerX = overviewWidth / 2;
    const centerY = overviewHeight / 2;
    const plotRadius = Math.min(overviewWidth, overviewHeight) * 0.44;
    const ringStep = plotRadius * 0.24;
    const cosYaw = Math.cos(viewState.yaw);
    const sinYaw = Math.sin(viewState.yaw);
    let furthestRange = 24;

    for (const drone of drones) {
      if (drone.leader) {
        continue;
      }

      furthestRange = Math.max(
        furthestRange,
        Math.hypot(drone.position.x - leader.position.x, drone.position.y - leader.position.y)
      );
    }

    const plotScale = plotRadius / (furthestRange + 12);
    const radarFill = overviewCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, plotRadius * 1.1);
    radarFill.addColorStop(0, "rgba(75, 165, 255, 0.12)");
    radarFill.addColorStop(0.55, "rgba(75, 165, 255, 0.05)");
    radarFill.addColorStop(1, "rgba(75, 165, 255, 0)");
    overviewCtx.fillStyle = radarFill;
    overviewCtx.beginPath();
    overviewCtx.arc(centerX, centerY, plotRadius * 1.08, 0, Math.PI * 2);
    overviewCtx.fill();

    overviewCtx.strokeStyle = "rgba(69, 92, 119, 0.22)";
    overviewCtx.lineWidth = 1;
    for (const radius of [ringStep, ringStep * 2, ringStep * 3, ringStep * 4]) {
      overviewCtx.beginPath();
      overviewCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      overviewCtx.stroke();
    }

    overviewCtx.beginPath();
    overviewCtx.moveTo(centerX - plotRadius, centerY);
    overviewCtx.lineTo(centerX + plotRadius, centerY);
    overviewCtx.moveTo(centerX, centerY - plotRadius);
    overviewCtx.lineTo(centerX, centerY + plotRadius);
    overviewCtx.stroke();

    const points = drones.map((drone) => ({
      leader: drone.leader,
      x:
        centerX +
        ((drone.position.x - leader.position.x) * cosYaw - (drone.position.y - leader.position.y) * sinYaw) *
          plotScale,
      y:
        centerY -
        ((drone.position.x - leader.position.x) * sinYaw + (drone.position.y - leader.position.y) * cosYaw) *
          plotScale *
          0.9,
    }));

    for (const [startIndex, endIndex] of meshLinks) {
      const start = points[startIndex];
      const end = points[endIndex];
      overviewCtx.strokeStyle = start.leader || end.leader ? "rgba(108, 186, 255, 0.48)" : "rgba(75, 165, 255, 0.18)";
      overviewCtx.lineWidth = start.leader || end.leader ? 1.2 : 1;
      overviewCtx.beginPath();
      overviewCtx.moveTo(start.x, start.y);
      overviewCtx.lineTo(end.x, end.y);
      overviewCtx.stroke();
    }

    for (const point of points) {
      overviewCtx.fillStyle = point.leader ? "#a7dbff" : "#4ba5ff";
      overviewCtx.beginPath();
      overviewCtx.arc(point.x, point.y, point.leader ? 4.2 : 3.2, 0, Math.PI * 2);
      overviewCtx.fill();
    }
  };

  const renderTelemetryPanel = (formation) => {
    if (!telemetry) {
      return;
    }

    const leader = drones[0];
    const scenarioLabel =
      selectedFormation === "auto" ? "Auto cycle" : formation.current.telemetryLabel || formation.current.label;
    telemetry.meshMode.textContent = "coordinated";
    telemetry.scenario.textContent = scenarioLabel;
    telemetry.nodeType.textContent = width <= 560 ? "LOKVS UWB mesh" : "LOKVS UWB module";
    telemetry.autopilot.textContent = formation.autopilotStatus;

    for (let index = 1; index < drones.length; index += 1) {
      const drone = drones[index];
      const row = telemetry.rows.get(drone.id);
      if (!row) {
        continue;
      }

      row.x.textContent = formatMeters(drone.position.x - leader.position.x);
      row.y.textContent = formatMeters(drone.position.y - leader.position.y);
      row.z.textContent = formatMeters(drone.position.z - leader.position.z);
    }
  };

  const draw = (frameTime) => {
    const time = frameTime * 0.001;
    const deltaTime = lastFrameTime === 0 ? 1 / 60 : Math.min(0.05, time - lastFrameTime);
    lastFrameTime = time;
    lastSimTime = time;

    const formation = updateDrones(time, deltaTime);
    const center = getSceneCenter();

    drawBackdrop(center);
    drawTrails(center);
    drawMeshLinks(center);

    const projectedDrones = drones
      .map((drone) => ({ drone, projection: projectPoint(drone.position, center) }))
      .sort((first, second) => second.projection.depth - first.projection.depth);

    for (const entry of projectedDrones) {
      drawDrone(entry.drone, center, entry.projection);
    }

    drawOverview();
    renderTelemetryPanel(formation);
    requestAnimationFrame(draw);
  };

  const endDrag = () => {
    viewState.dragging = false;
    viewState.pointerId = null;
    canvas.classList.remove("is-dragging");
  };

  canvas.addEventListener("pointerdown", (event) => {
    viewState.dragging = true;
    viewState.pointerId = event.pointerId;
    viewState.lastX = event.clientX;
    viewState.lastY = event.clientY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!viewState.dragging || event.pointerId !== viewState.pointerId) {
      return;
    }

    const deltaX = event.clientX - viewState.lastX;
    const deltaY = event.clientY - viewState.lastY;
    viewState.lastX = event.clientX;
    viewState.lastY = event.clientY;
    viewState.yaw += deltaX * 0.008;
    viewState.pitch = clamp(viewState.pitch - deltaY * 0.006, 0.32, 1.08);
  });

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const nextZoom = event.deltaY > 0 ? viewState.zoom * 0.92 : viewState.zoom * 1.08;
      viewState.zoom = clamp(nextZoom, 0.72, 1.55);
    },
    { passive: false }
  );

  for (const button of formationButtons) {
    button.addEventListener("click", () => {
      const nextFormation = button.dataset.formation || "auto";
      if (nextFormation === selectedFormation) {
        return;
      }

      selectedFormation = nextFormation;
      lastFormationChangeTime = lastSimTime;
      setFormationButtons(nextFormation);
    });
  }

  setFormationButtons(selectedFormation);
  configureCanvases();
  initializeDrones();
  requestAnimationFrame(draw);

  window.addEventListener("resize", () => {
    configureCanvases();
    for (const drone of drones) {
      drone.trail = [];
    }
  });
})();
