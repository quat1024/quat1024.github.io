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

console.log("hello from gravity.ts :)");

let running: boolean = true;

function makeInteractive() {
  running = true;
  
  const gravityDiv = document.getElementById("gravity")!;
  gravityDiv.classList.add("js");
  
  //engine
  const engine = Engine.create();
  const ground = Bodies.rectangle(400, 260, 2000, 40, { isStatic: true });;
  
  //buttons
  type NetscapeButton = {
    domElement: HTMLElement;
    matterBody: Body;
  };
  const netscapeButtons: NetscapeButton[] = [];
  
  let y = -30;
  for (const child of Array.from(gravityDiv.childNodes)) {
    if (child instanceof HTMLElement) {
      child.classList.add("js");
      
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
        console.log("dragstart!", child);
        child.style.pointerEvents = "none";
        e.preventDefault();

        const release = () => {
          console.log("mouseup!", child);
          child.style.pointerEvents = "auto";
          document.removeEventListener("mouseup", release);
        };
        document.addEventListener("mouseup", release);
      });

      //prevent dragging the image
      for (const child2 of Array.from(child.children)) {
        (child2 as any).draggable = false; //shush
      }
    }
  }
  
  Composite.add(engine.world, [
    ground,
    ...netscapeButtons.map((n) => n.matterBody),
  ]);

  //mouse
  const mouse = Mouse.create(gravityDiv);
  
  //force the mouse to release when dragged outside the arena
  gravityDiv.addEventListener("mouseleave", (e) => {
    mouse.mouseup(e); //event interfaces are similar enough that this type-pun works
  });
  
  const mc = MouseConstraint.create(engine, { mouse });
  mc.constraint.angularStiffness = 0.3;
  Composite.add(engine.world, mc);

  //renderer
  function loop() {
    if(!running) return;
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

function makeNoninteractive() {
  running = false;
  
  const gravityDiv = document.getElementById("gravity")!;
  gravityDiv.classList.remove("js");
  
  for (const child of Array.from(gravityDiv.childNodes)) {
    if (child instanceof HTMLElement) {
      child.classList.remove("js");
      child.style.transform = "";
    }
  }
  
  //kill all the event listeners
  gravityDiv.parentNode!.replaceChild(gravityDiv.cloneNode(true), gravityDiv);
}

function doIt() {
  const checkbox = document.getElementById("organize") as HTMLFormElement;
  
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  if(media.matches) {
    makeNoninteractive();
    checkbox.checked = true;
  } else {
    makeInteractive();
  }
  
  checkbox.addEventListener("change", () => {
    if(checkbox.checked) makeNoninteractive();
    else makeInteractive();
  });
  
  media.addEventListener("change", () => {
    if(media.matches) {
      checkbox.checked = true;
      makeNoninteractive();
    } else {
      checkbox.checked = false;
      makeInteractive();
    }
  });
}

document.addEventListener("DOMContentLoaded", doIt);
