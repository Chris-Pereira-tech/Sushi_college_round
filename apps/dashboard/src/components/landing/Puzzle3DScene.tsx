import { useEffect, useRef, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

export function Puzzle3DScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [patchStatus, setPatchStatus] = useState<'FLOATING' | 'LOCKING' | 'LOCKED'>('FLOATING');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animId: number | null = null;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Camera and 3D Rotation State
    let rotX = 0.42; // Isometric tilt down
    let rotY = -0.32; // Angled view
    let rotZ = 0.0;
    let targetRotX = 0.42;
    let targetRotY = -0.32;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let velX = 0;
    let velY = 0;

    // Mouse tracking for parallax tilt
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        velY = dx * 0.005;
        velX = -dy * 0.005;
        targetRotY += velY;
        targetRotX += velX;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      } else {
        // Soft magnetic parallax tilt
        targetRotY = -0.32 + (mouseX / (rect.width / 2)) * 0.28;
        targetRotX = 0.42 - (mouseY / (rect.height / 2)) * 0.22;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousedown', handleMouseDown);

    // 3D Matrix Rotation Helper
    const rotatePoint = (p: Point3D, rx: number, ry: number, rz: number): Point3D => {
      // Rotate around X
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y1 = p.y * cosX - p.z * sinX;
      const z1 = p.y * sinX + p.z * cosX;

      // Rotate around Y
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x2 = p.x * cosY + z1 * sinY;
      const z2 = -p.x * sinY + z1 * cosY;

      // Rotate around Z
      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);
      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      return { x: x3, y: y3, z: z2 };
    };

    // 3D Perspective Projection
    const FOV = 600;
    const project = (p: Point3D, cx: number, cy: number) => {
      const depth = FOV + p.z;
      const scale = depth > 20 ? FOV / depth : 1;
      return {
        x: cx + p.x * scale,
        y: cy + p.y * scale,
        scale,
        depth: p.z,
      };
    };

    // Generate 2D Jigsaw Contour Points
    // Returns array of 2D points outlining a piece with tabs and blanks
    const createJigsawPolygon = (
      w: number,
      h: number,
      topTab: number, // 1 = outward, -1 = inward, 0 = flat
      rightTab: number,
      bottomTab: number,
      leftTab: number
    ): Point2D[] => {
      const halfW = w / 2;
      const halfH = h / 2;
      const points: Point2D[] = [];

      // Helper to add an edge with optional jigsaw tab/blank
      const addEdge = (pStart: Point2D, pEnd: Point2D, tabDir: number) => {
        const dx = pEnd.x - pStart.x;
        const dy = pEnd.y - pStart.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        // Normal vector pointing outward
        const nx = -uy * tabDir;
        const ny = ux * tabDir;

        const tabR = len * 0.18; // tab head radius
        const neckW = len * 0.12;

        const p1 = { x: pStart.x + ux * (len * 0.36), y: pStart.y + uy * (len * 0.36) };
        const p2 = { x: p1.x - nx * (tabR * 0.3) + ux * (neckW * 0.3), y: p1.y - ny * (tabR * 0.3) + uy * (neckW * 0.3) };
        const pHead = { x: pStart.x + ux * (len * 0.5) + nx * (tabR * 1.6), y: pStart.y + uy * (len * 0.5) + ny * (tabR * 1.6) };
        const p3 = { x: pEnd.x - ux * (len * 0.36) - nx * (tabR * 0.3) - ux * (neckW * 0.3), y: pEnd.y - ny * (tabR * 0.3) - uy * (neckW * 0.3) };
        const p4 = { x: pEnd.x - ux * (len * 0.36), y: pEnd.y - uy * (len * 0.36) };

        points.push(pStart);
        if (tabDir !== 0) {
          // Bezier sampling for clean polygon contour
          for (let t = 0.15; t <= 1; t += 0.15) {
            const bx = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * p2.x + t * t * pHead.x;
            const by = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * p2.y + t * t * pHead.y;
            points.push({ x: bx, y: by });
          }
          for (let t = 0.15; t <= 1; t += 0.15) {
            const bx = (1 - t) * (1 - t) * pHead.x + 2 * (1 - t) * t * p3.x + t * t * p4.x;
            const by = (1 - t) * (1 - t) * pHead.y + 2 * (1 - t) * t * p3.y + t * t * p4.y;
            points.push({ x: bx, y: by });
          }
        }
      };

      // Top edge (Left to Right)
      addEdge({ x: -halfW, y: -halfH }, { x: halfW, y: -halfH }, topTab);
      // Right edge (Top to Bottom)
      addEdge({ x: halfW, y: -halfH }, { x: halfW, y: halfH }, rightTab);
      // Bottom edge (Right to Left)
      addEdge({ x: halfW, y: halfH }, { x: -halfW, y: halfH }, bottomTab);
      // Left edge (Bottom to Top)
      addEdge({ x: -halfW, y: halfH }, { x: -halfW, y: -halfH }, leftTab);

      return points;
    };

    // Pre-calculate puzzle polygons
    // Base tile size
    const PW = 110;
    const PH = 90;

    // Piece 1: Central Hotfix Patch (fits into Center Socket)
    // Socket has: top=-1 (blank), right=1 (tab), bottom=-1 (blank), left=1 (tab)
    // Therefore the Patch Piece must have the INVERSE tabs:
    // top=1 (tab), right=-1 (blank), bottom=1 (tab), left=-1 (blank)
    const patchPolygon2D = createJigsawPolygon(PW, PH, 1, -1, 1, -1);
    const socketPolygon2D = createJigsawPolygon(PW, PH, -1, 1, -1, 1);

    // Neighboring Locked Puzzle Tiles on the Grid (creating a real interlocking puzzle board)
    const neighborTiles = [
      // Left Neighbor (already fixed in board at x = -PW * 0.98)
      {
        offsetX: -PW * 1.05,
        offsetY: 0,
        poly: createJigsawPolygon(PW, PH, 1, 1, -1, 0),
        label: 'DOM_ROOT',
        status: 'BASE',
      },
      // Right Neighbor (already fixed in board at x = +PW * 0.98)
      {
        offsetX: PW * 1.05,
        offsetY: 0,
        poly: createJigsawPolygon(PW, PH, -1, 0, 1, -1),
        label: 'V1_STORE',
        status: 'BASE',
      },
      // Top Neighbor
      {
        offsetX: 0,
        offsetY: -PH * 1.08,
        poly: createJigsawPolygon(PW, PH, 0, 1, -1, -1),
        label: 'HEADER_NAV',
        status: 'BASE',
      },
    ];

    // Animation Lifecycle for "Fixing in Place"
    // Cycle duration: 7.0 seconds
    // 0.0 - 2.5s: Floating / Calibrating in 3D above socket (height Z = 75px, tilted)
    // 2.5 - 3.4s: Descending & Rotating into lock orientation (Laser align beams shoot)
    // 3.4 - 3.7s: SNAP! Locks firmly into place with haptic glow flash & shockwave
    // 3.7 - 6.0s: Securely fixed in place (Z = 0), circuitry glows intense green/magenta
    // 6.0 - 7.0s: Lifts gently back up to demonstrate continuous hotfix capability
    let cycleTime = 0;
    let snapFlash = 0; // Flash intensity 0 -> 1

    const render = () => {
      cycleTime = (cycleTime + 0.016) % 7.2;

      // Update rotation with inertia
      rotX += (targetRotX - rotX) * 0.08 + velX;
      rotY += (targetRotY - rotY) * 0.08 + velY;
      velX *= 0.92;
      velY *= 0.92;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      // Slight vertical offset to perfectly frame beneath hero title
      const centerY = height * 0.52;

      // Compute Patch Piece Animation Coordinates
      let patchZ = 0;
      let patchRotX = 0;
      let patchRotY = 0;
      let patchRotZ = 0;
      let alignmentAlpha = 0;
      let isSnapped = false;

      if (cycleTime < 2.5) {
        // Floating / hovering in 3D space above the board
        const t = cycleTime / 2.5;
        patchZ = 70 + Math.sin(t * Math.PI * 2) * 8;
        patchRotX = 0.28 + Math.cos(t * Math.PI * 2) * 0.06;
        patchRotY = 0.18 + Math.sin(t * Math.PI * 2) * 0.08;
        patchRotZ = -0.15;
        alignmentAlpha = 0.2 + Math.sin(cycleTime * 4) * 0.15;
      } else if (cycleTime < 3.4) {
        // Descending & aligning towards socket
        const t = (cycleTime - 2.5) / 0.9;
        const ease = t * t * (3 - 2 * t);
        patchZ = (1 - ease) * 70;
        patchRotX = (1 - ease) * 0.28;
        patchRotY = (1 - ease) * 0.18;
        patchRotZ = (1 - ease) * -0.15;
        alignmentAlpha = 0.5 + ease * 0.5;
      } else if (cycleTime < 6.0) {
        // LOCKED IN PLACE!
        patchZ = 0;
        patchRotX = 0;
        patchRotY = 0;
        patchRotZ = 0;
        isSnapped = true;
        if (cycleTime < 3.8) {
          snapFlash = Math.max(snapFlash, 1.0 - (cycleTime - 3.4) / 0.4);
        } else {
          snapFlash = 0;
        }
      } else {
        // Re-lifting / cycling
        const t = (cycleTime - 6.0) / 1.2;
        const ease = t * t;
        patchZ = ease * 70;
        patchRotX = ease * 0.28;
        patchRotY = ease * 0.18;
        patchRotZ = ease * -0.15;
      }

      // Update state for UI indicator
      if (isSnapped) {
        setPatchStatus('LOCKED');
      } else if (cycleTime >= 2.5 && cycleTime < 3.4) {
        setPatchStatus('LOCKING');
      } else {
        setPatchStatus('FLOATING');
      }

      // ─── 1. DRAW BACKGROUND 3D ISOMETRIC DOM SUBSTRATE GRID ───
      ctx.save();
      const gridSize = 420;
      const step = 42;
      ctx.strokeStyle = 'rgba(255, 59, 129, 0.06)';
      ctx.lineWidth = 1;

      for (let gx = -gridSize; gx <= gridSize; gx += step) {
        const p1 = project(rotatePoint({ x: gx, y: -gridSize, z: -10 }, rotX, rotY, rotZ), centerX, centerY);
        const p2 = project(rotatePoint({ x: gx, y: gridSize, z: -10 }, rotX, rotY, rotZ), centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      for (let gy = -gridSize; gy <= gridSize; gy += step) {
        const p1 = project(rotatePoint({ x: -gridSize, y: gy, z: -10 }, rotX, rotY, rotZ), centerX, centerY);
        const p2 = project(rotatePoint({ x: gridSize, y: gy, z: -10 }, rotX, rotY, rotZ), centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();

      // ─── 2. DRAW LOCKED NEIGHBORING PUZZLE TILES (Already in place) ───
      neighborTiles.forEach((tile) => {
        // Draw 3D Extruded Neighbor Tile at Z = 0
        const extrudeH = 8;
        const topPts = tile.poly.map((p) =>
          project(
            rotatePoint({ x: p.x + tile.offsetX, y: p.y + tile.offsetY, z: extrudeH }, rotX, rotY, rotZ),
            centerX,
            centerY
          )
        );

        // Top surface
        ctx.save();
        ctx.beginPath();
        topPts.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(19, 19, 26, 0.75)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 176, 207, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Label on neighbor tile
        const centerTile = project(
          rotatePoint({ x: tile.offsetX, y: tile.offsetY, z: extrudeH + 2 }, rotX, rotY, rotZ),
          centerX,
          centerY
        );
        ctx.font = `600 ${Math.floor(9 * centerTile.scale)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(255, 176, 207, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(tile.label, centerTile.x, centerTile.y);
        ctx.restore();
      });

      // ─── 3. DRAW THE HOLLOW JIGSAW SOCKET (The slot awaiting hotfix) ───
      const socketPts = socketPolygon2D.map((p) =>
        project(rotatePoint({ x: p.x, y: p.y, z: 0 }, rotX, rotY, rotZ), centerX, centerY)
      );

      ctx.save();
      // Socket floor recess
      ctx.beginPath();
      socketPts.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fillStyle = isSnapped ? 'rgba(255, 59, 129, 0.18)' : 'rgba(10, 8, 14, 0.85)';
      ctx.fill();

      // Glowing dashed border
      ctx.strokeStyle = isSnapped ? '#10b981' : '#ff3b81';
      ctx.lineWidth = isSnapped ? 2.2 : 1.5;
      if (!isSnapped) ctx.setLineDash([6, 4]);
      ctx.shadowColor = isSnapped ? '#10b981' : '#ff3b81';
      ctx.shadowBlur = isSnapped ? 16 : 8;
      ctx.stroke();
      ctx.restore();

      // ─── 4. ALIGNMENT LASER GUIDES (When descending into place) ───
      if (alignmentAlpha > 0 && patchZ > 4) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);

        // Connect 4 cardinal jigsaw tabs from floating patch to socket
        const corners = [
          { x: 0, y: -PH / 2 },
          { x: PW / 2, y: 0 },
          { x: 0, y: PH / 2 },
          { x: -PW / 2, y: 0 },
        ];

        corners.forEach((c) => {
          const fromPt = project(
            rotatePoint(
              {
                x: c.x,
                y: c.y,
                z: patchZ + 12,
              },
              rotX + patchRotX,
              rotY + patchRotY,
              rotZ + patchRotZ
            ),
            centerX,
            centerY
          );

          const toPt = project(rotatePoint({ x: c.x, y: c.y, z: 0 }, rotX, rotY, rotZ), centerX, centerY);

          ctx.beginPath();
          ctx.moveTo(fromPt.x, fromPt.y);
          ctx.lineTo(toPt.x, toPt.y);
          ctx.stroke();
        });
        ctx.restore();
      }

      // ─── 5. DRAW THE 3D EXTRUDED HOTFIX PATCH PIECE ───
      const pieceThick = 14; // 3D depth of piece
      const topPatchPts = patchPolygon2D.map((p) =>
        project(
          rotatePoint(
            { x: p.x, y: p.y, z: patchZ + pieceThick },
            rotX + patchRotX,
            rotY + patchRotY,
            rotZ + patchRotZ
          ),
          centerX,
          centerY
        )
      );

      const botPatchPts = patchPolygon2D.map((p) =>
        project(
          rotatePoint(
            { x: p.x, y: p.y, z: patchZ },
            rotX + patchRotX,
            rotY + patchRotY,
            rotZ + patchRotZ
          ),
          centerX,
          centerY
        )
      );

      // Draw Side Extrusion Walls
      ctx.save();
      ctx.fillStyle = 'rgba(32, 14, 28, 0.9)';
      ctx.strokeStyle = 'rgba(255, 59, 129, 0.4)';
      ctx.lineWidth = 1;

      for (let i = 0; i < topPatchPts.length; i += 2) {
        const next = (i + 1) % topPatchPts.length;
        ctx.beginPath();
        ctx.moveTo(botPatchPts[i].x, botPatchPts[i].y);
        ctx.lineTo(topPatchPts[i].x, topPatchPts[i].y);
        ctx.lineTo(topPatchPts[next].x, topPatchPts[next].y);
        ctx.lineTo(botPatchPts[next].x, botPatchPts[next].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Draw Top Face of 3D Jigsaw Piece
      ctx.save();
      ctx.beginPath();
      topPatchPts.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();

      // Cyber Glassmorphic Gradient
      const pieceGrad = ctx.createLinearGradient(
        topPatchPts[0].x,
        topPatchPts[0].y,
        topPatchPts[Math.floor(topPatchPts.length / 2)].x,
        topPatchPts[Math.floor(topPatchPts.length / 2)].y
      );
      if (isSnapped) {
        pieceGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        pieceGrad.addColorStop(1, 'rgba(255, 59, 129, 0.35)');
      } else {
        pieceGrad.addColorStop(0, 'rgba(255, 59, 129, 0.38)');
        pieceGrad.addColorStop(1, 'rgba(56, 189, 248, 0.28)');
      }

      ctx.fillStyle = pieceGrad;
      ctx.fill();

      // Top Edge Stroke
      ctx.strokeStyle = isSnapped ? '#10b981' : '#ff3b81';
      ctx.lineWidth = isSnapped ? 2.5 : 2.0;
      ctx.shadowColor = isSnapped ? '#10b981' : '#ff3b81';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      // Top Face Micro-Details: Circuit Traces & Center Patch Badge
      const patchCenter = project(
        rotatePoint(
          { x: 0, y: 0, z: patchZ + pieceThick + 2 },
          rotX + patchRotX,
          rotY + patchRotY,
          rotZ + patchRotZ
        ),
        centerX,
        centerY
      );

      ctx.save();
      // Glowing Micro-Chip in center
      ctx.fillStyle = isSnapped ? '#10b981' : '#ffffff';
      ctx.shadowColor = isSnapped ? '#10b981' : '#ff3b81';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(patchCenter.x, patchCenter.y - 8 * patchCenter.scale, 4 * patchCenter.scale, 0, Math.PI * 2);
      ctx.fill();

      // 3D Text on the puzzle piece
      ctx.font = `700 ${Math.floor(10 * patchCenter.scale)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(isSnapped ? '✓ HOTFIX LOCKED' : 'HOTFIX PATCH #01', patchCenter.x, patchCenter.y + 10 * patchCenter.scale);

      ctx.font = `600 ${Math.floor(8 * patchCenter.scale)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isSnapped ? '#10b981' : '#ffb0cf';
      ctx.fillText(isSnapped ? 'SEAMS CONVERGED (0.00% DIFF)' : 'ALIGNING 3D SOCKET...', patchCenter.x, patchCenter.y + 22 * patchCenter.scale);
      ctx.restore();

      // ─── 6. SNAP SHOCKWAVE BURST (When locking firmly into place) ───
      if (snapFlash > 0.01) {
        ctx.save();
        const shockRadius = (1.0 - snapFlash) * 160;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, shockRadius * 1.6, shockRadius * 0.9, rotZ, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${snapFlash * 0.8})`;
        ctx.lineWidth = 3 * snapFlash;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[1500px] max-h-[900px] cursor-grab active:cursor-grabbing opacity-70 transition-opacity hover:opacity-90"
        title="3D Jigsaw Hotfix Engine — Drag to inspect assembly in 3D"
      />

      {/* Floating Status Badge directly tied to 3D Puzzle Lock State */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container/90 border border-primary-container/40 backdrop-blur-md shadow-lg">
          <span
            className={`size-2 rounded-full ${
              patchStatus === 'LOCKED'
                ? 'bg-emerald-400 animate-ping'
                : patchStatus === 'LOCKING'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-primary-container animate-pulse'
            }`}
          />
          <span className="font-mono text-[11px] text-white tracking-wider uppercase">
            {patchStatus === 'LOCKED'
              ? '3D PUZZLE HOTFIX: LOCKED IN PLACE'
              : patchStatus === 'LOCKING'
              ? '3D PUZZLE HOTFIX: SNAPPING TO DOM SOCKET...'
              : '3D PUZZLE HOTFIX: POSITIONING IN 3D SPACE'}
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-bold">
            {patchStatus === 'LOCKED' ? 'SEALED' : 'DRAG TO ORBIT'}
          </span>
        </div>
      </div>
    </div>
  );
}
