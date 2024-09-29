// deno-lint-ignore-file no-window no-window-prefix

import {
  Bodies,
  Body,
  Bounds,
  Composite,
  Engine,
  Mouse,
  MouseConstraint,
//  Render,
  Runner,
} from "matter-js";

console.log("hello from gravity.ts");

function doIt() {
  const gravityDiv = document.getElementById("gravity")!;
  gravityDiv.style.overflow = "hidden";
  gravityDiv.style.width = "100%";
  gravityDiv.style.height = "250px";
  gravityDiv.style.position = "relative";
  
  //engine
  const engine = Engine.create();
  const ground = Bodies.rectangle(400, 260, 2000, 40, { isStatic: true });
  
  function sizeGround() {
    if(true) return; //TODO can't get this to work right
    
    const verts = ground.parts[0].vertices;

    const x0 = -100;
    const x1 = gravityDiv.clientWidth + 100;
    const y0 = gravityDiv.clientHeight;
    const y1 = gravityDiv.clientHeight + 20;
    console.log(x0, x1, y0, y1);

    Object.assign(verts[0], { x: x0, y: y0 });
    Object.assign(verts[1], { x: x0, y: y1 });
    Object.assign(verts[2], { x: x1, y: y1 });
    Object.assign(verts[3], { x: x1, y: y0 });
    //clumsily copied out of Body.scale()
    //i don't use that function b/c it's cumulative
    Bounds.update(
      ground.parts[0].bounds,
      ground.parts[0].vertices,
      ground.velocity,
    );
  }
  window.addEventListener("resize", sizeGround);
  sizeGround();
  
  //buttons
  type NetscapeButton = {
    domElement: HTMLAnchorElement;
    matterBody: Body;
  };
  const netscapeButtons: NetscapeButton[] = [];
  
  let y = -30;
  for (const child of Array.from(gravityDiv.children)) {
    if (child instanceof HTMLAnchorElement) {
      
      const x = (Math.random() - 0.5) * 80 + (gravityDiv.clientWidth / 2);
      y -= 35;
      
      const matterBody = Bodies.rectangle(x, y, 88, 31);
      matterBody.torque = (Math.random() - 0.5) * 10;
      matterBody.render.QUAT_backingElement = child;

      netscapeButtons.push({
        domElement: child,
        matterBody,
      });

      //need to disable the link while you're click-and-dragging
      child.addEventListener("dragstart", (e) => {
        child.style.pointerEvents = "none";
        e.preventDefault();

        const release = () => {
          child.style.pointerEvents = "auto";
          document.removeEventListener("mouseup", release);
        };
        document.addEventListener("mouseup", release);
      });

      //prevent dragging the image
      for (const child2 of Array.from(child.children)) {
        (child2 as any).draggable = false; //shush
        child2.addEventListener("drag", (e) => e.preventDefault());
      }
    }
  }
  
  //populate
  Composite.add(engine.world, [
    ground,
    ...netscapeButtons.map((n) => n.matterBody),
  ]);

  //mouse
  const mouse = Mouse.create(gravityDiv);
  const mc = MouseConstraint.create(engine, { mouse });
  Composite.add(engine.world, mc);

  //force the mouse to release when dragged outside the arena
  gravityDiv.addEventListener("mouseleave", (e) => {
    mouse.mouseup(e); //event interfaces are similar enough that this works
  });

  //renderer
  function loop() {
    window.requestAnimationFrame(loop);

    const bodies = Composite.allBodies(engine.world);
    for (const body of bodies) {
      const domElement: HTMLElement = body.render.QUAT_backingElement;
      if (!domElement) {
        continue;
      }

      const x = body.position.x - 44;
      const y = body.position.y - 15.5;

      if (
        x < -90 || x > gravityDiv.clientWidth + 20 ||
        y > gravityDiv.clientHeight * 2
      ) {
        Body.setPosition(body, { x: gravityDiv.clientWidth / 2, y: -50 });
        Body.setVelocity(body, { x: 0, y: 0 });
        body.torque = (Math.random() - 0.5) * 10;
      }

      domElement.style.transform =
        `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
    }
  }
  loop();

  const runner = Runner.create();
  Runner.run(runner, engine);

  console.log("got thru it!");
}

document.addEventListener("DOMContentLoaded", doIt);
