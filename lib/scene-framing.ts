import { Vector3, type Box3, type PerspectiveCamera } from "three";

// Called only by the lazy-loaded scene. Fit the actual rotated bounds, not a
// column-count estimate, so unfolded bands and portrait viewports never crop.
export function fitBeadCamera(camera: PerspectiveCamera, target: Vector3, bounds: Box3, padding = 1.12) {
  if (bounds.isEmpty()) return camera.position.distanceTo(target);
  const back = camera.position.clone().sub(target).normalize();
  const right = new Vector3().crossVectors(camera.up, back).normalize();
  const up = new Vector3().crossVectors(back, right).normalize();
  const center = bounds.getCenter(new Vector3());
  const tangent = Math.tan(camera.fov * Math.PI / 360);
  let distance = camera.near * 2;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const offset = new Vector3(x,y,z).sub(center), depth = offset.dot(back);
    distance = Math.max(distance, depth + padding * Math.abs(offset.dot(right)) / (tangent * camera.aspect), depth + padding * Math.abs(offset.dot(up)) / tangent);
  }
  target.copy(center);
  camera.position.copy(center).addScaledVector(back, distance);
  camera.far = Math.max(1000, distance + bounds.getSize(new Vector3()).length() * 2);
  camera.updateProjectionMatrix();
  return distance;
}
