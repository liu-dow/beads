"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { type Design, type BeadColor, materialCounts } from "@/lib/design";
import { LoaderCircle, Monitor } from "lucide-react";

export type SceneHandle={capture:(width?:number,transparent?:boolean)=>string;reset:()=>void;zoom:(factor:number)=>void;};
type Props={design:Design;shape:"ring"|"flat";light:string;background:string;rotate:boolean;editing:boolean;onPaint:(index:number)=>void;onReady?:(ready:boolean)=>void;activeCell?:number;onHover?:(index:number)=>void;highlightColor?:number;visible?:boolean;};
type World={scene:THREE.Scene;renderer:THREE.WebGLRenderer;camera:THREE.PerspectiveCamera;controls:OrbitControls;group:THREE.Group;floor:THREE.Mesh;key:THREE.DirectionalLight;geometry:THREE.LatheGeometry;meshes:THREE.InstancedMesh[];extras:THREE.Mesh[];environment:THREE.WebGLRenderTarget;reset:()=>void;marker:THREE.Mesh;needsRender:boolean;};

function beadMaterial(p:BeadColor){
  const values={matte:{roughness:.64,metalness:0,clearcoat:.08},gloss:{roughness:.22,metalness:.03,clearcoat:.75},metal:{roughness:.27,metalness:1,clearcoat:.32},pearl:{roughness:.26,metalness:.12,clearcoat:.8,iridescence:.22},glass:{roughness:.12,metalness:0,transmission:.72,thickness:.65,ior:1.5,attenuationDistance:2.8,attenuationColor:new THREE.Color(p.hex)}}[p.finish];
  return new THREE.MeshPhysicalMaterial({color:p.hex,...values,clearcoatRoughness:.19,envMapIntensity:p.finish==="metal"?1.55:1.0});
}
export const BraceletScene=forwardRef<SceneHandle,Props>(function BraceletScene(props,ref){
  const host=useRef<HTMLDivElement>(null),world=useRef<World|null>(null),latest=useRef(props);latest.current=props;
  const [state,setState]=useState<"loading"|"ready"|"error">("loading");
  const visualPalette=props.design.palette.map(p=>`${p.id}:${p.hex}:${p.finish}`).join("|");
  useImperativeHandle(ref,()=>({
    capture(width=2400,transparent=false){
      const w=world.current;if(!w)throw new Error("3D 预览尚未准备好，请稍后重试。");
      const {renderer,camera,scene,floor}=w;const size=renderer.getSize(new THREE.Vector2()),pixel=renderer.getPixelRatio(),aspect=camera.aspect,bg=scene.background,visible=floor.visible;
      try{renderer.setPixelRatio(1);renderer.setSize(width,Math.round(width*.75),false);camera.aspect=4/3;camera.updateProjectionMatrix();if(transparent){scene.background=null;floor.visible=false;}renderer.render(scene,camera);return renderer.domElement.toDataURL("image/png");}
      finally{scene.background=bg;floor.visible=visible;renderer.setPixelRatio(pixel);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();renderer.render(scene,camera);}
    },
    reset(){world.current?.reset();},
    zoom(factor){const w=world.current;if(!w)return;const direction=w.camera.position.clone().sub(w.controls.target).multiplyScalar(factor);if(direction.length()>w.controls.minDistance&&direction.length()<w.controls.maxDistance){w.camera.position.copy(w.controls.target).add(direction);w.controls.update();}}
  }),[]);
  useEffect(()=>{
    const el=host.current;if(!el)return;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});}catch{setState("error");return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.setAttribute("aria-label","可旋转和缩放的米珠手环三维预览");el.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,1000),controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=true;controls.minDistance=35;controls.maxDistance=500;controls.maxPolarAngle=Math.PI*.86;controls.autoRotateSpeed=.65;
    const room=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(room,.035);scene.environment=environment.texture;room.dispose();pmrem.dispose();
    const key=new THREE.DirectionalLight(0xfff4df,3.1);key.position.set(-45,85,65);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-110;key.shadow.camera.right=110;key.shadow.camera.top=100;key.shadow.camera.bottom=-100;key.shadow.camera.near=1;key.shadow.camera.far=220;key.shadow.bias=-.0004;key.shadow.normalBias=.07;key.shadow.radius=3;scene.add(key);
    const fill=new THREE.DirectionalLight(0xcbe4f3,1.15);fill.position.set(70,20,-50);scene.add(fill,new THREE.HemisphereLight(0xf2f8ff,0x929b84,.8));
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.ShadowMaterial({color:0x2a382c,opacity:.23}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
    const profile=[[.34,-.58],[.38,-.655],[.64,-.655],[.745,-.605],[.77,-.50],[.77,.50],[.745,.605],[.64,.655],[.38,.655],[.34,.58],[.34,-.58]].map(([x,y])=>new THREE.Vector2(x,y));
    const geometry=new THREE.LatheGeometry(profile,24);geometry.computeVertexNormals();
    const group=new THREE.Group();scene.add(group);
    const marker=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xffbf57,side:THREE.BackSide,depthWrite:false}));marker.visible=false;group.add(marker);
    const reset=()=>{
      const d=latest.current.design;const scale=d.size/1.6;
      if(latest.current.shape==="ring"){const radius=d.cols*1.56/6.03;const s=Math.max(radius/29,d.rows/28,.8)*scale;camera.position.set(58*s,46*s,91*s);controls.target.set(0,1*scale,0);camera.up.set(.08,1,0);}
      else{const s=Math.max(d.cols/112,.7)*scale;camera.position.set(26*s,100*s,151*s);controls.target.set(0,0,0);camera.up.set(0,1,0);}
      const framing=1.12*Math.max(1,1/camera.aspect);camera.position.sub(controls.target).multiplyScalar(framing).add(controls.target);
      controls.update();if(world.current)world.current.needsRender=true;
    };
    world.current={scene,renderer,camera,controls,group,floor,key,geometry,meshes:[],extras:[],environment,reset,marker,needsRender:true};
    const resize=()=>{const {width,height}=el.getBoundingClientRect();if(width<1||height<1)return;const previous=camera.aspect;renderer.setSize(width,height);camera.aspect=width/height;camera.position.sub(controls.target).multiplyScalar(Math.min(1,previous)/Math.min(1,camera.aspect)).add(controls.target);camera.updateProjectionMatrix();if(world.current)world.current.needsRender=true;};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();reset();
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down={x:0,y:0};
    const onDown=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};};
    const hitTest=(e:PointerEvent)=>{const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(world.current?.meshes??[],false)[0];return hit&&hit.instanceId!==undefined?hit.object.userData.indices[hit.instanceId] as number:-1;};
    let hovered=-1;
    const onMove=(e:PointerEvent)=>{const index=hitTest(e);if(index!==hovered){hovered=index;latest.current.onHover?.(index);}};
    const onLeave=()=>{hovered=-1;latest.current.onHover?.(-1);};
    const onUp=(e:PointerEvent)=>{if(e.button!==0||!latest.current.editing||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const index=hitTest(e);if(index>=0){latest.current.onHover?.(index);latest.current.onPaint(index);}};
    renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointermove",onMove);renderer.domElement.addEventListener("pointerleave",onLeave);
    let frame=0;const animate=()=>{frame=requestAnimationFrame(animate);if(document.hidden||el.clientWidth===0||latest.current.visible===false)return;controls.autoRotate=latest.current.rotate&&!latest.current.editing;controls.enableRotate=!latest.current.editing;renderer.domElement.style.cursor=latest.current.editing?"crosshair":"grab";const changed=controls.update();if(changed||world.current?.needsRender||controls.autoRotate){renderer.render(scene,camera);if(world.current)world.current.needsRender=false;}};animate();setState("ready");latest.current.onReady?.(true);
    const loss=(e:Event)=>{e.preventDefault();setState("error");latest.current.onReady?.(false);};renderer.domElement.addEventListener("webglcontextlost",loss);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onUp);renderer.domElement.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("pointerleave",onLeave);renderer.domElement.removeEventListener("webglcontextlost",loss);world.current?.meshes.forEach(m=>{(m.material as THREE.Material).dispose();m.dispose();});world.current?.extras.forEach(m=>{m.geometry.dispose();(m.material as THREE.Material).dispose();});(marker.material as THREE.Material).dispose();geometry.dispose();(floor.material as THREE.Material).dispose();floor.geometry.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();world.current=null;};
  },[]);
  useEffect(()=>{
    const w=world.current;if(!w)return;const d=props.design;
    w.meshes.forEach(m=>{w.group.remove(m);(m.material as THREE.Material).dispose();m.dispose();});w.meshes=[];w.extras.forEach(m=>{w.group.remove(m);m.geometry.dispose();(m.material as THREE.Material).dispose();});w.extras=[];
    const transform=new THREE.Object3D(),scale=d.size/1.6;const arc=2*Math.PI-.25,radius=d.cols*1.56/arc;
    for(const p of materialCounts(d)){
      const indices:number[]=[];d.cells.forEach((v,i)=>{if(v===p.index)indices.push(i);});
      const mesh=new THREE.InstancedMesh(w.geometry,beadMaterial(p),indices.length);mesh.userData.indices=indices;mesh.castShadow=true;mesh.receiveShadow=true;
      indices.forEach((i,n)=>{
        const r=Math.floor(i/d.cols),c=i%d.cols,offset=(r-(d.rows-1)/2+(c%2)*.5-.25)*1.376;
        const jitter=Math.sin(i*78.233)*.018;
        if(props.shape==="ring"){const a=(c/(d.cols-1))*arc+.125+Math.PI;transform.position.set(Math.sin(a)*(radius+jitter),offset,Math.cos(a)*(radius+jitter));transform.rotation.set(jitter*.4,a,jitter*.5);}
        else{transform.position.set((c-(d.cols-1)/2)*1.56,offset,Math.cos(c/d.cols*Math.PI*2)*1.8);transform.rotation.set(jitter,0,jitter);}
        transform.scale.set(1+jitter*.15,1+jitter*.2,1+jitter*.15);transform.updateMatrix();mesh.setMatrixAt(n,transform.matrix);
        const color=new THREE.Color(0xffffff).multiplyScalar(.965+(Math.sin(i*12.9)+1)*.025);mesh.setColorAt(n,color);
      });mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();w.group.add(mesh);w.meshes.push(mesh);
    }
    const claspColor=d.palette.find(p=>p.finish==="metal")?.hex??"#c9a45c";
    for(const side of [-1,1]){
      const bar=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,d.rows*1.376-1,16),new THREE.MeshStandardMaterial({color:claspColor,metalness:1,roughness:.25}));
      if(props.shape==="ring")bar.position.set(side*(radius*Math.sin(.125)-1),0,-radius*Math.cos(.125));
      else bar.position.set(side*(d.cols*1.56/2+.55),0,1.8);
      bar.castShadow=true;bar.receiveShadow=true;w.group.add(bar);w.extras.push(bar);
      for(const y of [-.32,0,.32]){
        const loop=new THREE.Mesh(new THREE.TorusGeometry(.75,.13,7,16),new THREE.MeshStandardMaterial({color:claspColor,metalness:1,roughness:.24}));
        loop.position.copy(bar.position);loop.position.y=y*d.rows*1.376;
        loop.position.x+=props.shape==="ring"?-side*.75:side*.75;
        loop.castShadow=true;w.group.add(loop);w.extras.push(loop);
      }
    }
    w.group.scale.setScalar(scale);w.group.rotation.set(props.shape==="ring"?.05:-.12,0,props.shape==="ring"?-.18:-.08);w.group.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(w.group);w.floor.position.y=box.min.y-.15;
    w.needsRender=true;
  // Only geometry and visible material changes require rebuilding instances.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.design.cells,props.design.rows,props.design.cols,props.design.size,visualPalette,props.shape,state]);
  useEffect(()=>{
    const w=world.current;if(!w)return;w.marker.visible=false;
    for(const mesh of w.meshes){
      const indices=mesh.userData.indices as number[];
      indices.forEach((index,n)=>{
        const brightness=props.highlightColor!==undefined&&props.design.cells[index]!==props.highlightColor ? .24 : .965+(Math.sin(index*12.9)+1)*.025;
        mesh.setColorAt(n,new THREE.Color(0xffffff).multiplyScalar(brightness));
        if(index===props.activeCell){const matrix=new THREE.Matrix4();mesh.getMatrixAt(n,matrix);matrix.decompose(w.marker.position,w.marker.quaternion,w.marker.scale);w.marker.scale.multiplyScalar(1.14);w.marker.visible=true;}
      });if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    }w.needsRender=true;
  },[props.activeCell,props.highlightColor,props.design.cells,props.design.rows,props.design.cols,props.design.size,visualPalette,props.shape,state]);
  useEffect(()=>{world.current?.reset();},[props.shape,props.design.rows,props.design.cols,props.design.size]);
  useEffect(()=>{
    const w=world.current;if(!w)return;w.scene.background=new THREE.Color(props.background);
    if(props.light==="warm"){w.key.color.set(0xffdcac);w.key.intensity=3.6;w.key.position.set(-60,65,45);w.renderer.toneMappingExposure=1.12;}
    else if(props.light==="dramatic"){w.key.color.set(0xf6f6ff);w.key.intensity=4.7;w.key.position.set(-65,35,10);w.renderer.toneMappingExposure=.85;}
    else{w.key.color.set(0xfff4e5);w.key.intensity=3.1;w.key.position.set(-45,85,65);w.renderer.toneMappingExposure=1.1;}
    w.needsRender=true;
  },[props.light,props.background,state]);
  return <div ref={host} className="scene-canvas">{state==="loading"&&<div className="scene-message"><LoaderCircle className="animate-spin"/><span>正在呈现每一颗珠子…</span></div>}{state==="error"&&<div className="scene-message"><Monitor/><b>3D 预览暂时不可用</b><span>请使用支持 WebGL 的浏览器，或切换到 2D 图纸继续设计。</span></div>}</div>;
});
