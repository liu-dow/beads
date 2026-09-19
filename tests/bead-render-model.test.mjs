import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { Box3, LatheGeometry, PerspectiveCamera, Vector2, Vector3 } from "three";

const vite = await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/bead-render",server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
after(()=>vite.close());
const { BEAD_MODEL, BEAD_PROFILE, BEAD_SURFACES, beadPose, beadVariation } = await vite.ssrLoadModule("/lib/bead-render-model.ts");
const { PUBLIC_WORKS, workDesign, publicWork, workPreviewUrl, braceletPreviewUrl, PATTERN_PREVIEW_VERSION } = await vite.ssrLoadModule("/lib/portfolio.ts");
const { fitBeadCamera } = await vite.ssrLoadModule("/lib/scene-framing.ts");

test("portrait and landscape cameras contain the entire flat and curved beadwork",()=>{
  for(const aspect of [.65,1,1.6,2.4])for(const size of [1,1.3,1.6,3])for(const width of [80,250]){
    const camera=new PerspectiveCamera(35,aspect,.1,1000),target=new Vector3();
    camera.position.set(12,35,106);
    const bounds=new Box3(new Vector3(-width/2,-35,-35).multiplyScalar(size),new Vector3(width/2,35,35).multiplyScalar(size));
    fitBeadCamera(camera,target,bounds);camera.lookAt(target);camera.updateMatrixWorld();
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const projected=new Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(projected.x)<.9&&Math.abs(projected.y)<.9,`uncropped ${aspect}/${size}/${width}`);
      assert.ok(projected.z>-1&&projected.z<1);
    }
  }
});

test("flat and wrapped beads preserve chart rows, stagger and index identity",()=>{
  for (const work of PUBLIC_WORKS) for (const shape of ["ring","flat"]) {
    const {rows,cols}=work;
    for(let col=0;col<cols;col++) {
      const top=beadPose(rows,cols,col,shape),bottom=beadPose(rows,cols,(rows-1)*cols+col,shape);
      assert.ok(top.y>bottom.y,`${work.slug}: chart row zero remains at the top`);
      assert.ok(Math.abs(top.y-bottom.y-(rows-1)*BEAD_MODEL.rowPitch)<.031);
    }
    for(let index=0;index<rows*cols;index++) {
      const pose=beadPose(rows,cols,index,shape);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.deepEqual(pose,beadPose(rows,cols,index,shape));
      assert.ok(pose.scale>=.991&&pose.scale<=1.009);
    }
  }
  const first=beadPose(40,136,0,"flat"),second=beadPose(40,136,1,"flat");
  assert.ok(second.x>first.x);
  assert.ok(Math.abs(first.y-second.y-BEAD_MODEL.rowPitch/2)<1e-12);
});

test("rounded hollow bead geometry has finite normals and retains an open bore",()=>{
  assert.deepEqual(BEAD_PROFILE[0],BEAD_PROFILE.at(-1),"closed wall profile");
  assert.ok(BEAD_PROFILE.every(([radius])=>radius>=BEAD_MODEL.bore));
  const mesh=new LatheGeometry(BEAD_PROFILE.map(([x,y])=>new Vector2(x,y)),24);
  mesh.computeVertexNormals();mesh.computeBoundingBox();
  assert.ok([...mesh.attributes.normal.array].every(Number.isFinite));
  assert.ok(Math.abs(mesh.boundingBox.max.y-BEAD_MODEL.halfHeight)<1e-6);
  assert.ok(mesh.attributes.position.count<500,"shared bead mesh stays lightweight");
  mesh.dispose();
  assert.ok(BEAD_SURFACES.matte.roughness>BEAD_SURFACES.gloss.roughness);
  assert.equal(BEAD_SURFACES.metal.metalness,1);
  assert.equal(BEAD_SURFACES.matte.metalness,0);
  for(let i=0;i<1000;i++)assert.ok(Math.abs(beadVariation(i))<=1);
});

test("art studies retain full editable resolution and retired cartoons are not published",()=>{
  for(const slug of ["starry-current","sunflower-nocturne","azure-rosette","gilded-palmette"]){
    const work=publicWork(slug),design=workDesign(work);
    assert.deepEqual([design.rows,design.cols,design.cells.length],[40,136,5440]);
    assert.ok(new Set(design.cells).size>=7);
    assert.ok(design.palette.every(color=>!color.sku&&!color.catalogId));
  }
  for(const slug of ["pocket-puppy","orbiting-cat","cloud-bear","rainbow-balloons","woodland-fox","moonlit-rabbit","silk-ribbon","strawberry-tea","swan-reverie","butterfly-silk","cherry-sunday","catnap-garden","wildflower-study","ivory-garden"])assert.equal(publicWork(slug),undefined,slug);
});

test("renderer revisions invalidate all static and alternate-colour preview URLs",()=>{
  for(const work of PUBLIC_WORKS)for(const palette of ["original","moonlight"]){
    for(const path of [workPreviewUrl(work,palette),braceletPreviewUrl(work,palette)]){
      const url=new URL(path,"https://test.invalid");
      assert.equal(url.searchParams.get("v"),`${PATTERN_PREVIEW_VERSION}-${work.previewVersion??"1"}`);
      if(palette!=="original")assert.equal(url.searchParams.get("palette"),palette);
    }
  }
});
