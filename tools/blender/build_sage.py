import math
import os

import bpy
from mathutils import Vector


ROOT = "/work"
MODEL_PATH = os.path.join(ROOT, "static", "models", "signal-sage.glb")
PREVIEW_PATH = os.path.join(ROOT, "artifacts", "sage-proof.png")
SWAT_PREVIEW_PATH = os.path.join(ROOT, "artifacts", "sage-proof-swat.png")
REVEAL_PREVIEW_PATH = os.path.join(ROOT, "artifacts", "sage-proof-reveal.png")
SIDE_PREVIEW_PATH = os.path.join(ROOT, "artifacts", "sage-proof-side.png")

OCCUPANT_SCALE = 0.72
HEAD_SCALE = 0.82
HAT_SCALE = 0.78
OCCUPANT_PIVOT = Vector((0.0, 0.05, 0.92))
OCCUPANT_LIFT = 0.08


def occupant_point(point):
    return tuple(
        OCCUPANT_PIVOT
        + (Vector(point) - OCCUPANT_PIVOT) * OCCUPANT_SCALE
        + Vector((0.0, 0.0, OCCUPANT_LIFT))
    )


def scaled_shape(shape, scale=OCCUPANT_SCALE):
    return tuple(value * scale for value in shape)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (
        bpy.data.actions,
        bpy.data.armatures,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.materials,
        bpy.data.meshes,
    ):
        for item in list(block):
            block.remove(item)


def material(name, color, metallic=0.0, roughness=0.8, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        emission_socket = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
        if emission_socket:
            emission_socket.default_value = (*emission, 1.0)
        strength_socket = shader.inputs.get("Emission Strength")
        if strength_socket:
            strength_socket.default_value = 3.0
    return mat


def finish_mesh(obj, mat, bevel=0.0):
    if mat:
        obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    if bevel > 0:
        modifier = obj.modifiers.new("single-cut corners", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def cube(name, location, scale, mat, bevel=0.0, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, mat, bevel)


def cylinder(name, location, radius, depth, mat, vertices=8, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    return finish_mesh(obj, mat)


def cone(name, location, radius_top, radius_bottom, depth, mat, vertices=8, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    return finish_mesh(obj, mat)


def sphere(name, location, scale, mat, subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, mat)


def torus(name, location, major_radius, minor_radius, mat, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=12,
        minor_segments=4,
        location=location,
        major_radius=major_radius,
        minor_radius=minor_radius,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    return finish_mesh(obj, mat)


def create_rig():
    armature_data = bpy.data.armatures.new("SignalSageSkeleton")
    armature = bpy.data.objects.new("SignalSageRig", armature_data)
    bpy.context.collection.objects.link(armature)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def add_bone(name, head, tail, parent=None):
        bone = armature_data.edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        if parent:
            bone.parent = armature_data.edit_bones[parent]
        return bone

    add_bone("root", (0, 0, 0.25), (0, 0, 0.55))
    add_bone("chair", (0, 0, 0.55), (0, 0, 1.15), "root")
    add_bone("pelvis", occupant_point((0, 0, 0.92)), occupant_point((0, 0, 1.2)), "chair")
    add_bone("spine", occupant_point((0, 0, 1.1)), occupant_point((0, 0, 1.95)), "pelvis")
    add_bone("head", occupant_point((0, 0, 1.95)), occupant_point((0, 0, 2.55)), "spine")
    add_bone("robe_secondary", occupant_point((0, -0.05, 1.2)), occupant_point((0, -0.34, 1.05)), "pelvis")
    add_bone("hat_secondary", occupant_point((0, 0, 2.88)), occupant_point((0.15, 0.02, 3.62)), "head")
    add_bone("upper_arm.L", occupant_point((-0.25, 0, 1.82)), occupant_point((-0.78, 0, 1.65)), "spine")
    add_bone("forearm.L", occupant_point((-0.78, 0, 1.65)), occupant_point((-1.08, -0.02, 1.38)), "upper_arm.L")
    add_bone("hand.L", occupant_point((-1.08, -0.02, 1.38)), occupant_point((-1.23, -0.05, 1.25)), "forearm.L")
    add_bone("upper_arm.R", occupant_point((0.25, 0, 1.82)), occupant_point((0.78, 0, 1.65)), "spine")
    add_bone("forearm.R", occupant_point((0.78, 0, 1.65)), occupant_point((1.08, -0.02, 1.38)), "upper_arm.R")
    add_bone("hand.R", occupant_point((1.08, -0.02, 1.38)), occupant_point((1.23, -0.05, 1.25)), "forearm.R")

    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    armature["character"] = "Signal Sage"
    armature["animation_base_fps"] = 24
    armature["default_pose_rate"] = 12
    return armature


def parent_to_bone(obj, armature, bone_name):
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def build_character(armature):
    navy = material("robe_navy", (0.065, 0.075, 0.29), roughness=0.96)
    robe_edge = material("robe_violet", (0.23, 0.07, 0.48), roughness=0.9)
    boot_mat = material("boot_dark", (0.045, 0.025, 0.09), roughness=0.94)
    hat = material("hat_indigo", (0.045, 0.025, 0.19), roughness=0.92)
    hat_band = material("hat_band", (0.28, 0.06, 0.43), roughness=0.88)
    case = material("crt_case", (0.52, 0.47, 0.34), roughness=0.92)
    case_dark = material("crt_case_dark", (0.19, 0.17, 0.12), roughness=0.9)
    screen = material("crt_glass", (0.008, 0.035, 0.04), metallic=0.08, roughness=0.32)
    amber = material("crt_amber", (1.0, 0.38, 0.035), roughness=0.35, emission=(1.0, 0.16, 0.01))
    glove = material("glove", (0.82, 0.76, 0.57), roughness=0.85)
    chair_shell = material("chair_shell", (0.16, 0.018, 0.24), roughness=0.84)
    chair_pad = material("chair_pad", (0.035, 0.025, 0.065), roughness=0.94)
    chair_trim = material("chair_trim", (0.08, 0.68, 0.72), metallic=0.12, roughness=0.5)
    chair_metal = material("chair_metal", (0.075, 0.09, 0.12), metallic=0.65, roughness=0.38)
    magic = material("thruster_magic", (0.1, 0.8, 0.85), roughness=0.22, emission=(0.04, 0.55, 1.0))

    pieces = []

    # A padded office chair: separate upholstery, frame, arm supports and casters.
    # Its front edge ends behind the knees; the occupant sits on the cushion.
    pieces.extend([
        cube("ChairSeat", (0, 0.02, 0.98), (0.76, 0.58, 0.10), chair_pad, 0.09),
        cube("ChairSeatShell", (0, 0.06, 0.86), (0.79, 0.59, 0.065), chair_shell, 0.06),
        cube("ChairSeatFront", (0, -0.53, 0.94), (0.68, 0.055, 0.07), chair_pad, 0.04),
        cube("ChairSeatTrim", (0, -0.54, 0.87), (0.62, 0.015, 0.018), chair_trim, 0.01),
        cube("ChairBack", (0, 0.48, 1.66), (0.73, 0.13, 0.65), chair_shell, 0.12, (-0.09, 0, 0)),
        cube("ChairBackPad", (0, 0.31, 1.76), (0.59, 0.11, 0.43), chair_pad, 0.10, (-0.09, 0, 0)),
        cube("ChairLumbar", (0, 0.22, 1.30), (0.56, 0.15, 0.16), chair_pad, 0.09),
        cube("ChairBackSeam", (0, 0.19, 1.58), (0.49, 0.015, 0.018), chair_shell, 0.009),
        cube("ChairBackSpine", (0, 0.65, 1.44), (0.14, 0.055, 0.58), chair_metal, 0.035),
        cube("ChairHeadrest", (0, 0.47, 2.43), (0.46, 0.14, 0.17), chair_pad, 0.09),
        cube("ChairHeadrestShell", (0, 0.58, 2.43), (0.48, 0.07, 0.18), chair_shell, 0.07),
        cylinder("HeadrestPostL", (-0.22, 0.48, 2.27), 0.035, 0.30, chair_metal),
        cylinder("HeadrestPostR", (0.22, 0.48, 2.27), 0.035, 0.30, chair_metal),
        cube("BackBolsterL", (-0.63, 0.28, 1.72), (0.12, 0.15, 0.46), chair_shell, 0.08, (-0.09, -0.04, 0)),
        cube("BackBolsterR", (0.63, 0.28, 1.72), (0.12, 0.15, 0.46), chair_shell, 0.08, (-0.09, 0.04, 0)),
        cube("ArmBracketL", (-0.79, 0.05, 0.89), (0.16, 0.11, 0.055), chair_metal, 0.03),
        cube("ArmBracketR", (0.79, 0.05, 0.89), (0.16, 0.11, 0.055), chair_metal, 0.03),
        cylinder("ArmPostL", (-0.86, 0.02, 1.15), 0.055, 0.48, chair_metal),
        cylinder("ArmPostR", (0.86, 0.02, 1.15), 0.055, 0.48, chair_metal),
        cube("ArmRestL", (-0.86, -0.13, 1.41), (0.14, 0.39, 0.075), chair_pad, 0.065),
        cube("ArmRestR", (0.86, -0.13, 1.41), (0.14, 0.39, 0.075), chair_pad, 0.065),
        cylinder("ReclineHingeL", (-0.77, 0.35, 1.02), 0.11, 0.075, chair_metal, 12, (0, math.pi / 2, 0)),
        cylinder("ReclineHingeR", (0.77, 0.35, 1.02), 0.11, 0.075, chair_metal, 12, (0, math.pi / 2, 0)),
        cube("SeatMechanism", (0, 0.10, 0.73), (0.27, 0.27, 0.09), chair_metal, 0.045),
        cylinder("ChairStem", (0, 0.10, 0.47), 0.075, 0.49, chair_metal, 12),
        cylinder("ChairStemSleeve", (0, 0.10, 0.36), 0.11, 0.30, chair_shell, 12),
        cylinder("ChairBaseHub", (0, 0.10, 0.20), 0.19, 0.12, chair_metal, 12),
        cube("HeightLever", (0.43, 0.05, 0.76), (0.27, 0.035, 0.035), chair_metal, 0.02),
        cube("HeightLeverGrip", (0.65, 0.05, 0.76), (0.12, 0.075, 0.045), chair_pad, 0.035),
    ])
    for index in range(5):
        angle = index * math.tau / 5 + math.pi / 2
        x, y = math.cos(angle), math.sin(angle)
        pieces.append(cube(f"ChairSpoke{index}", (x * 0.43, 0.10 + y * 0.43, 0.19), (0.42, 0.055, 0.045), chair_metal, 0.025, (0, 0, angle)))
        pieces.append(cylinder(f"CasterStem{index}", (x * 0.83, 0.10 + y * 0.83, 0.15), 0.035, 0.14, chair_metal))
        for side in (-1, 1):
            # Twin wheels on each swivel fork, with visible axle caps.
            position = (x * 0.83 - y * side * 0.065, 0.10 + y * 0.83 + x * side * 0.065, 0.09)
            pieces.append(cylinder(f"CasterWheel{index}_{side}", position, 0.105, 0.075, chair_pad, 12, (math.pi / 2, 0, angle)))
        pieces.append(cube(f"CasterFork{index}", (x * 0.83, 0.10 + y * 0.83, 0.14), (0.075, 0.065, 0.065), chair_shell, 0.035, (0, 0, angle)))
    for piece in pieces:
        parent_to_bone(piece, armature, "chair")

    # Rayman-like silhouette: a tiny rounded robe and floating cartoon shoes.
    # No thighs, knees or shins. The empty space is part of the character design.
    pelvis_parts = [
        sphere("RobeTorso", (0, 0.025, 1.44), (0.33, 0.27, 0.30), navy, subdivisions=2),
        sphere("RobeLap", (0, -0.12, 1.20), (0.32, 0.28, 0.095), navy, subdivisions=2),
        sphere("RobeLapTrim", (0, -0.12, 1.155), (0.30, 0.26, 0.045), robe_edge, subdivisions=2),
        sphere("BootL", (-0.26, -0.91, 0.91), (0.20, 0.29, 0.14), hat_band, subdivisions=2),
        sphere("BootR", (0.26, -0.91, 0.91), (0.20, 0.29, 0.14), hat_band, subdivisions=2),
        sphere("BootSoleL", (-0.26, -0.94, 0.80), (0.205, 0.29, 0.045), glove, subdivisions=2),
        sphere("BootSoleR", (0.26, -0.94, 0.80), (0.205, 0.29, 0.045), glove, subdivisions=2),
    ]
    for piece in pelvis_parts:
        parent_to_bone(
            piece,
            armature,
            "spine" if piece.name == "RobeTorso" else "robe_secondary" if piece.name in {"RobeLap", "RobeLapTrim"} else "pelvis",
        )

    collar = cylinder("RobeCollar", occupant_point((0, 0, 1.91)), 0.21, 0.19, robe_edge, 10)
    parent_to_bone(collar, armature, "spine")
    for index, height in enumerate((1.48, 1.36)):
        button = sphere(f"RobeButton{index}", (0, -0.245, height), (0.035, 0.024, 0.035), amber, subdivisions=2)
        parent_to_bone(button, armature, "spine")

    # Keep the invisible arm bones and their animation clips. Only the floating
    # mittens are drawn, including when they touch the keyboard or cart handle.
    # Mario 64-style ball hands avoid intersecting finger cylinders during large poses.
    for side, x in (("L", -1.16), ("R", 1.16)):
        hand = sphere(
            f"Hand{side}",
            occupant_point((x, -0.80, 1.65)),
            scaled_shape((0.26, 0.21, 0.26), HEAD_SCALE),
            glove,
            subdivisions=2,
        )
        parent_to_bone(hand, armature, f"hand.{side}")

    # CRT head with a thick silhouette, top vents, and a geometry-based face.
    head_parts = [
        cube("MonitorCase", occupant_point((0, -0.02, 2.38)), scaled_shape((0.62, 0.42, 0.46), HEAD_SCALE), case, 0.09),
        cube("MonitorBezel", occupant_point((0, -0.44, 2.38)), scaled_shape((0.54, 0.055, 0.37), HEAD_SCALE), case_dark, 0.04),
        cube("MonitorScreen", occupant_point((0, -0.505, 2.38)), scaled_shape((0.47, 0.025, 0.30), HEAD_SCALE), screen, 0.032),
        cube("EyeLeft", occupant_point((-0.19, -0.542, 2.45)), scaled_shape((0.10, 0.018, 0.055), HEAD_SCALE), amber, 0.020),
        cube("EyeRight", occupant_point((0.19, -0.542, 2.45)), scaled_shape((0.10, 0.018, 0.055), HEAD_SCALE), amber, 0.020),
        cube("Mouth", occupant_point((0, -0.543, 2.24)), scaled_shape((0.16, 0.018, 0.025), HEAD_SCALE), amber, 0.010),
    ]
    for piece in head_parts:
        parent_to_bone(piece, armature, "head")

    # A few textureless decals keep the model tiny while making it look authored.
    for index, x in enumerate((-0.34, -0.17, 0.0, 0.17, 0.34)):
        vent = cube(
            f"TopVent{index}",
            occupant_point((x, -0.03, 2.86)),
            scaled_shape((0.045, 0.18, 0.018), HEAD_SCALE),
            case_dark,
            0.008,
        )
        parent_to_bone(vent, armature, "head")

    # One continuous crown: shared rings eliminate the old stacked-cone seams.
    # Coordinates are relative to the brim, with the tip curling to the right.
    base = Vector(occupant_point((0, -0.01, 2.91)))
    rings = [(0, 0, .50), (.01, .09, .47), (.10, .53, .23),
             (.29, .77, .08), (.43, .75, .008)]
    vertices = []
    segments = 6
    for x, z, radius in rings:
        for j in range(segments):
            angle = 2 * math.pi * j / segments
            vertices.append(tuple(base + Vector((x + radius * math.cos(angle),
                                                  radius * math.sin(angle), z))))
    faces = [tuple(reversed(range(segments)))]
    for ring in range(len(rings) - 1):
        for j in range(segments):
            nxt = (j + 1) % segments
            faces.append((ring * segments + j, ring * segments + nxt,
                          (ring + 1) * segments + nxt, (ring + 1) * segments + j))
    faces.append(tuple((len(rings) - 1) * segments + j for j in range(segments)))
    mesh = bpy.data.meshes.new("ContinuousHatCrown")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    crown = bpy.data.objects.new("HatCrown", mesh)
    bpy.context.collection.objects.link(crown)
    finish_mesh(crown, hat)
    hat_parts = [
        cylinder("HatBrim", tuple(base), .62, .075, hat, 6),
        crown,
        torus("HatBand", tuple(base + Vector((.01, 0, .065))), .48, .035, hat_band),
    ]
    # Chunky five-point stars hug the faceted crown. Project every vertex onto
    # the surface so the decorations stay attached even across a facet edge.
    bpy.context.view_layer.update()
    for index, (x, z, size, angle) in enumerate([
        (-.19, .18, .065, -math.pi / 2),
        (.12, .29, .095, -math.pi / 2),
        (.14, .51, .057, -math.pi / 2),
        (.27, .67, .035, -math.pi / 2),
        (.01, .22, .075, -.25),
        (.10, .46, .052, -.25),
    ]):
        outward = Vector((math.cos(angle), math.sin(angle), 0))
        tangent = Vector((-math.sin(angle), math.cos(angle), 0))
        star_vertices = []
        for j in range(10):
            theta = math.pi / 2 + j * math.pi / 5
            radius = size if j % 2 == 0 else size * .46
            origin = base + tangent * (x + radius * math.cos(theta))
            origin += Vector((0, 0, z + radius * math.sin(theta))) + outward * 2
            hit, point, normal, face = crown.ray_cast(origin, -outward)
            if not hit:
                raise RuntimeError(f"Hat star {index} extends past the crown")
            star_vertices.append(tuple(point + outward * .012))
        star_mesh = bpy.data.meshes.new(f"HatStar{index}")
        star_mesh.from_pydata(star_vertices, [], [tuple(range(10))])
        star_mesh.update()
        star = bpy.data.objects.new(f"HatStar{index}", star_mesh)
        bpy.context.collection.objects.link(star)
        finish_mesh(star, amber)
        hat_parts.append(star)
    for piece in hat_parts:
        parent_to_bone(piece, armature, "hat_secondary")

    return {
        "screen": bpy.data.objects["MonitorScreen"],
        "eye_left": bpy.data.objects["EyeLeft"],
        "eye_right": bpy.data.objects["EyeRight"],
        "mouth": bpy.data.objects["Mouth"],
    }


def reset_pose(armature):
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def apply_pose(armature, pose):
    reset_pose(armature)
    for bone_name, values in pose.items():
        bone = armature.pose.bones[bone_name]
        if "location" in values:
            bone.location = values["location"]
        if "rotation" in values:
            bone.rotation_euler = values["rotation"]
        if "scale" in values:
            bone.scale = values["scale"]


def create_action(armature, name, keyframes, interpolation="CONSTANT"):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    armature.animation_data_create()
    armature.animation_data.action = action
    # Authored extrema are preserved. Smoothstep in-betweens give gestures
    # anticipation and settling, while the body holds two frames at 24 fps.
    for frame in range(keyframes[0][0], keyframes[-1][0] + 1):
        for bone in armature.pose.bones:
            sample = frame if bone.name in ("root", "chair") else frame - (frame - 1) % 2
            left_frame, left_pose = keyframes[0]
            right_frame, right_pose = keyframes[-1]
            for index in range(len(keyframes) - 1):
                if keyframes[index][0] <= sample <= keyframes[index + 1][0]:
                    left_frame, left_pose = keyframes[index]
                    right_frame, right_pose = keyframes[index + 1]
                    break
            fraction = max(0, min(1, (sample - left_frame) / max(1, right_frame - left_frame)))
            ease = fraction * fraction * (3 - 2 * fraction)
            for channel, default in (("location", (0, 0, 0)), ("rotation", (0, 0, 0)), ("scale", (1, 1, 1))):
                start = left_pose.get(bone.name, {}).get(channel, default)
                end = right_pose.get(bone.name, {}).get(channel, default)
                value = tuple(a + (b - a) * ease for a, b in zip(start, end))
                attribute = "rotation_euler" if channel == "rotation" else channel
                setattr(bone, attribute, value)
                bone.keyframe_insert(data_path=attribute, frame=frame, group=bone.name)
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "LINEAR" if any('bones["' + name + '"]' in fcurve.data_path for name in ("root", "chair")) else "CONSTANT"
    action["pose_rate"] = 12
    armature.animation_data.action = None
    reset_pose(armature)
    return action


def build_actions(armature):
    actions = []
    actions.append(
        create_action(
            armature,
            "idle",
            [
                (1, {}),
                (37, {"chair": {"location": (0, 0, 0.009)}, "head": {"rotation": (0.02, 0, -0.009)}}),
                (73, {"chair": {"location": (0, 0, 0.018)}, "spine": {"rotation": (0.015, 0, 0.018)}}),
                (109, {"chair": {"location": (0, 0, 0.02)}, "head": {"rotation": (-0.015, 0, 0.012)}}),
                (145, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "ascend",
            [
                (1, {"spine": {"rotation": (-0.05, 0, 0)}, "head": {"rotation": (0.08, 0, 0)}}),
                (5, {"spine": {"rotation": (0.18, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, -0.2)}, "upper_arm.R": {"rotation": (0, 0, 0.2)}}),
                (9, {"spine": {"rotation": (-0.16, 0, 0)}, "head": {"rotation": (-0.18, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 0.45)}, "upper_arm.R": {"rotation": (0, 0, -0.45)}}),
                (15, {"spine": {"rotation": (0.08, 0, 0)}, "head": {"rotation": (0.04, 0, 0)}}),
                (21, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "reaction",
            [
                (1, {}),
                (4, {"spine": {"rotation": (0.22, 0, 0)}, "head": {"rotation": (-0.22, 0, -0.18)}}),
                (7, {"spine": {"rotation": (-0.28, 0, 0)}, "head": {"rotation": (0.22, 0, 0.16)}, "upper_arm.L": {"rotation": (0, 0, 1.05)}, "upper_arm.R": {"rotation": (0, 0, -1.05)}, "forearm.L": {"rotation": (0.25, 0, -0.65)}, "forearm.R": {"rotation": (-0.25, 0, 0.65)}}),
                (12, {"spine": {"rotation": (-0.08, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 0.62)}, "upper_arm.R": {"rotation": (0, 0, -0.62)}}),
                (18, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "thinking",
            [
                (1, {}),
                (5, {"head": {"rotation": (0.02, 0, -0.18)}, "spine": {"rotation": (0.06, 0, -0.04)}}),
                (10, {"head": {"rotation": (-0.08, 0, -0.28)}, "upper_arm.L": {"rotation": (0.1, -0.18, -0.72)}, "forearm.L": {"rotation": (-0.2, 0.12, -1.05)}, "hand.L": {"rotation": (0, 0, -0.18)}}),
                (16, {"head": {"rotation": (0.04, 0, -0.22)}, "upper_arm.L": {"rotation": (0.1, -0.18, -0.66)}, "forearm.L": {"rotation": (-0.2, 0.12, -0.95)}}),
                (23, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "suspicious",
            [
                (1, {}),
                (4, {"spine": {"rotation": (0.02, 0, -0.12)}, "head": {"rotation": (0.02, 0, 0.34)}}),
                (9, {"spine": {"rotation": (-0.1, 0, 0.18)}, "head": {"rotation": (-0.06, 0, -0.42)}, "upper_arm.R": {"rotation": (0, 0, -0.46)}, "forearm.R": {"rotation": (0, 0, 0.42)}}),
                (15, {"spine": {"rotation": (0.02, 0, -0.1)}, "head": {"rotation": (0.04, 0, 0.28)}}),
                (22, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "shocked",
            [
                (1, {}),
                (3, {"chair": {"location": (0, 0, -0.08)}, "spine": {"rotation": (0.34, 0, 0)}, "head": {"rotation": (0.26, 0, 0)}}),
                (6, {"chair": {"location": (0, 0, 0.12)}, "spine": {"rotation": (-0.42, 0, 0)}, "head": {"rotation": (-0.34, 0, 0)}, "upper_arm.L": {"rotation": (-0.22, 0, 1.38)}, "upper_arm.R": {"rotation": (0.22, 0, -1.38)}, "forearm.L": {"rotation": (0, 0, -0.55)}, "forearm.R": {"rotation": (0, 0, 0.55)}}),
                (11, {"chair": {"location": (0, 0, 0.04)}, "spine": {"rotation": (-0.18, 0, 0)}, "head": {"rotation": (-0.12, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 0.92)}, "upper_arm.R": {"rotation": (0, 0, -0.92)}}),
                (19, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "smug",
            [
                (1, {}),
                (5, {"spine": {"rotation": (-0.08, 0, 0.1)}, "head": {"rotation": (0.08, 0, -0.2)}}),
                (10, {"spine": {"rotation": (-0.12, 0, 0.16)}, "head": {"rotation": (0.1, 0, -0.28)}, "upper_arm.L": {"rotation": (0, 0, 0.78)}, "upper_arm.R": {"rotation": (0, 0, -0.78)}, "forearm.L": {"rotation": (0, 0, -0.72)}, "forearm.R": {"rotation": (0, 0, 0.72)}}),
                (17, {"spine": {"rotation": (-0.06, 0, 0.1)}, "head": {"rotation": (0.08, 0, -0.2)}, "upper_arm.L": {"rotation": (0, 0, 0.52)}, "upper_arm.R": {"rotation": (0, 0, -0.52)}}),
                (24, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "popup_swat",
            [
                (1, {}),
                (5, {"head": {"rotation": (0, 0, 0.5)}, "spine": {"rotation": (0.02, 0, 0.16)}}),
                (9, {"spine": {"rotation": (0.08, 0, -0.26)}, "head": {"rotation": (0, 0, 0.62)}, "upper_arm.L": {"rotation": (-0.22, 0.3, -1.48)}, "forearm.L": {"rotation": (0.12, -0.25, -1.25)}}),
                (12, {"chair": {"location": (0, 0, 0.07)}, "spine": {"rotation": (-0.3, 0, 0.44)}, "head": {"rotation": (0.08, 0, -0.26)}, "upper_arm.L": {"rotation": (0.24, -0.34, 1.52)}, "forearm.L": {"rotation": (-0.22, 0.28, 0.96)}, "hand.L": {"scale": (1.32, 1.32, 1.32)}}),
                (15, {"chair": {"location": (0, 0, 0.03)}, "spine": {"rotation": (-0.18, 0, 0.3)}, "upper_arm.L": {"rotation": (0.12, -0.14, 1.06)}, "forearm.L": {"rotation": (-0.1, 0.12, 0.62)}, "hand.L": {"scale": (1.12, 1.12, 1.12)}}),
                (23, {"head": {"rotation": (0, 0, -0.1)}}),
                (30, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "weak_answer",
            [
                (1, {}),
                (6, {"chair": {"location": (0, 0, -0.06)}, "spine": {"rotation": (0.25, 0, 0)}, "head": {"rotation": (0.28, 0, 0.05)}, "upper_arm.L": {"rotation": (0, 0, -0.18)}, "upper_arm.R": {"rotation": (0, 0, 0.18)}}),
                (13, {"chair": {"location": (0, 0, -0.12)}, "spine": {"rotation": (0.34, 0, 0)}, "head": {"rotation": (0.42, 0, -0.04)}}),
                (22, {"chair": {"location": (0, 0, -0.04)}, "spine": {"rotation": (0.12, 0, 0)}}),
                (28, {}),
            ],
        )
    )
    actions.append(
        create_action(
            armature,
            "reveal",
            [
                (1, {"head": {"rotation": (0.12, 0, 0)}}),
                (6, {"spine": {"rotation": (0.18, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, -0.35)}, "upper_arm.R": {"rotation": (0, 0, 0.35)}}),
                (11, {"spine": {"rotation": (-0.15, 0, 0)}, "head": {"rotation": (-0.14, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 1.28)}, "upper_arm.R": {"rotation": (0, 0, -1.28)}, "forearm.L": {"rotation": (0, 0, -0.32)}, "forearm.R": {"rotation": (0, 0, 0.32)}}),
                (19, {"spine": {"rotation": (-0.08, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 1.0)}, "upper_arm.R": {"rotation": (0, 0, -1.0)}}),
                (29, {}),
            ],
        )
    )

    # Presentation recovery inventory. These are deliberately separate actions so
    # the browser state machine can ask for a readable silhouette instead of
    # pretending that one generic reaction covers every joke.
    authored_actions = {
        "talk": [
            (1, {"spine": {"rotation": (-0.04, 0, -0.02)}, "head": {"rotation": (0.03, 0, 0)}}),
            (19, {"spine": {"rotation": (-0.10, 0, 0.05)}, "head": {"rotation": (-0.04, 0, -0.06)}, "forearm.L": {"rotation": (0, 0, -0.38)}}),
            (43, {"spine": {"rotation": (-0.07, 0, -0.04)}, "head": {"rotation": (0.05, 0, 0.05)}, "forearm.R": {"rotation": (0, 0, 0.42)}}),
            (73, {}),
        ],
        "attentive": [
            (1, {}),
            (7, {"spine": {"rotation": (-0.22, 0, 0)}, "head": {"rotation": (0.14, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 0.20)}, "upper_arm.R": {"rotation": (0, 0, -0.20)}}),
            (17, {"spine": {"rotation": (-0.17, 0, 0)}, "head": {"rotation": (0.10, 0, 0)}}),
            (24, {}),
        ],
        "approval": [
            (1, {}),
            (5, {"head": {"rotation": (0.22, 0, 0)}, "spine": {"rotation": (-0.08, 0, 0)}}),
            (9, {"head": {"rotation": (-0.20, 0, 0)}, "upper_arm.R": {"rotation": (0, 0, -0.65)}, "forearm.R": {"rotation": (0, 0, 0.72)}}),
            (13, {"head": {"rotation": (0.18, 0, 0)}}),
            (20, {}),
        ],
        "confusion": [
            (1, {}),
            (7, {"head": {"rotation": (0.02, 0, -0.32)}, "spine": {"rotation": (0.06, 0, 0.10)}, "upper_arm.L": {"rotation": (0, 0, 0.92)}, "upper_arm.R": {"rotation": (0, 0, -0.92)}, "forearm.L": {"rotation": (0, 0, 0.22)}, "forearm.R": {"rotation": (0, 0, -0.22)}}),
            (15, {"head": {"rotation": (-0.04, 0, 0.28)}, "upper_arm.L": {"rotation": (0, 0, 0.72)}, "upper_arm.R": {"rotation": (0, 0, -0.72)}}),
            (23, {}),
        ],
        "lie": [
            (1, {}),
            (6, {"head": {"rotation": (0.04, 0, 0.46)}, "spine": {"rotation": (0.02, 0, -0.12)}, "forearm.R": {"rotation": (0, 0, 0.82)}}),
            (13, {"head": {"rotation": (0.04, 0, -0.50)}, "spine": {"rotation": (0.02, 0, 0.12)}, "forearm.L": {"rotation": (0, 0, -0.82)}}),
            (20, {"head": {"rotation": (0.10, 0, 0)}}),
            (27, {}),
        ],
        "chair_wobble": [
            (1, {}),
            (4, {"chair": {"rotation": (0.06, 0, 0.12), "location": (0, 0, 0.05)}}),
            (8, {"chair": {"rotation": (-0.05, 0, -0.15), "location": (0, 0, -0.04)}}),
            (12, {"chair": {"rotation": (0.03, 0, 0.08)}}),
            (18, {}),
        ],
        "drop": [
            (1, {"chair": {"location": (0, 0, 0.10)}, "spine": {"rotation": (-0.10, 0, 0)}}),
            (4, {"chair": {"location": (0, 0, -0.22)}, "spine": {"rotation": (0.28, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 1.0)}, "upper_arm.R": {"rotation": (0, 0, -1.0)}}),
            (9, {"chair": {"location": (0, 0, -0.48)}, "head": {"rotation": (0.32, 0, 0)}}),
            (15, {"chair": {"location": (0, 0, -0.08)}, "spine": {"rotation": (-0.18, 0, 0)}}),
            (22, {}),
        ],
        "popup_notice": [
            (1, {}),
            (7, {"head": {"rotation": (0.02, 0, 0.46)}, "spine": {"rotation": (0, 0, 0.10)}}),
            (14, {"head": {"rotation": (0.02, 0, -0.08)}, "spine": {"rotation": (-0.05, 0, -0.02)}}),
            (22, {"head": {"rotation": (0, 0, 0.52)}}),
            (28, {}),
        ],
        "workstation_exit": [
            (1, {}),
            (6, {"chair": {"rotation": (0.03, 0, -0.10)}, "spine": {"rotation": (-0.26, 0, -0.08)}, "upper_arm.L": {"rotation": (0, 0, -0.34)}, "upper_arm.R": {"rotation": (0, 0, 0.34)}}),
            (13, {"chair": {"rotation": (-0.04, 0, 0.13)}, "spine": {"rotation": (-0.20, 0, 0.08)}}),
            (20, {"chair": {"rotation": (0.02, 0, -0.08)}, "spine": {"rotation": (-0.24, 0, -0.05)}}),
        ],
        "workstation_push": [
            (1, {"spine": {"rotation": (-0.30, 0, 0)}, "upper_arm.L": {"rotation": (0.12, 0, 0.62)}, "upper_arm.R": {"rotation": (-0.12, 0, -0.62)}, "forearm.L": {"rotation": (0, 0, -0.56)}, "forearm.R": {"rotation": (0, 0, 0.56)}}),
            (7, {"chair": {"location": (0, 0, 0.06), "rotation": (0.04, 0, 0.05)}, "spine": {"rotation": (-0.42, 0, 0)}}),
            (14, {"chair": {"location": (0, 0, -0.05), "rotation": (-0.04, 0, -0.04)}, "spine": {"rotation": (-0.28, 0, 0)}}),
            (21, {"spine": {"rotation": (-0.36, 0, 0)}, "upper_arm.L": {"rotation": (0.12, 0, 0.70)}, "upper_arm.R": {"rotation": (-0.12, 0, -0.70)}}),
        ],
        "workstation_park": [
            (1, {"spine": {"rotation": (-0.28, 0, 0)}}),
            (4, {"chair": {"rotation": (0.10, 0, -0.18), "location": (0, 0, -0.10)}, "spine": {"rotation": (0.18, 0, 0.12)}}),
            (8, {"chair": {"rotation": (-0.06, 0, 0.14), "location": (0, 0, 0.08)}, "head": {"rotation": (-0.20, 0, -0.16)}}),
            (13, {"chair": {"rotation": (0.02, 0, -0.04)}, "spine": {"rotation": (-0.10, 0, 0)}}),
            (19, {}),
        ],
        "workstation_turn": [
            (1, {}),
            (7, {"chair": {"rotation": (0.02, 0, -0.10)}, "head": {"rotation": (0.02, 0, 0.30)}, "spine": {"rotation": (-0.10, 0, 0.08)}}),
            (14, {"chair": {"rotation": (-0.02, 0, 0.08)}, "head": {"rotation": (0.02, 0, -0.30)}, "upper_arm.L": {"rotation": (0, 0, 0.46)}, "upper_arm.R": {"rotation": (0, 0, -0.46)}}),
            (20, {"head": {"rotation": (0.02, 0, 0)}, "spine": {"rotation": (-0.08, 0, 0)}}),
        ],
    }

    # Research uses the same seated anatomy as dialogue. The old rear-view
    # head lift and pelvis slide separated the CRT and pushed the legs into the chair.
    back_head = {"rotation": (0, 0, 0)}
    back_pose = {"head": back_head}
    authored_actions.update({
        "research_typing": [
            (1, {**back_pose, "upper_arm.L": {"rotation": (0.30, 0, 1.10)}, "upper_arm.R": {"rotation": (-0.30, 0, -1.10)}, "forearm.L": {"rotation": (0.25, 0, -0.70)}, "forearm.R": {"rotation": (-0.25, 0, 0.70)}}),
            (5, {**back_pose, "spine": {"rotation": (-0.10, 0, 0)}, "forearm.L": {"rotation": (0.18, 0, -0.52)}, "forearm.R": {"rotation": (-0.18, 0, 0.82)}}),
            (9, {**back_pose, "spine": {"rotation": (-0.06, 0, 0)}, "forearm.L": {"rotation": (0.22, 0, -0.82)}, "forearm.R": {"rotation": (-0.22, 0, 0.52)}}),
            (13, {**back_pose, "upper_arm.L": {"rotation": (0.30, 0, 1.10)}, "upper_arm.R": {"rotation": (-0.30, 0, -1.10)}, "forearm.L": {"rotation": (0.25, 0, -0.70)}, "forearm.R": {"rotation": (-0.25, 0, 0.70)}}),
        ],
        "research_one_hand": [
            (1, {**back_pose, "spine": {"rotation": (-0.08, 0, -0.16)}, "upper_arm.R": {"rotation": (-0.25, 0, -1.08)}, "forearm.R": {"rotation": (-0.2, 0, 0.66)}, "forearm.L": {"rotation": (0, 0, -0.15)}}),
            (7, {**back_pose, "head": {**back_head, "rotation": (0.02, 0, -0.18)}, "forearm.R": {"rotation": (-0.22, 0, 0.88)}}),
            (14, {**back_pose, "spine": {"rotation": (-0.06, 0, 0.12)}, "forearm.R": {"rotation": (-0.20, 0, 0.56)}}),
        ],
        "research_inspect": [
            (1, {**back_pose}),
            (7, {**back_pose, "spine": {"rotation": (-0.42, 0, 0)}, "head": {**back_head, "rotation": (0.24, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 0.30)}, "upper_arm.R": {"rotation": (0, 0, -0.30)}}),
            (16, {**back_pose, "spine": {"rotation": (-0.34, 0, 0)}, "head": {**back_head, "rotation": (0.18, 0, 0)}}),
            (23, {**back_pose}),
        ],
        "research_smack": [
            (1, {**back_pose}),
            (6, {**back_pose, "spine": {"rotation": (0.02, 0, -0.18)}, "upper_arm.R": {"rotation": (-0.20, 0, -1.52)}, "forearm.R": {"rotation": (-0.10, 0, 1.18)}}),
            (9, {**back_pose, "spine": {"rotation": (-0.30, 0, 0.24)}, "upper_arm.R": {"rotation": (0.28, 0, -0.42)}, "forearm.R": {"rotation": (-0.32, 0, -0.28)}, "hand.R": {"scale": (1.24, 1.24, 1.24)}}),
            (16, {**back_pose, "upper_arm.R": {"rotation": (0, 0, -0.52)}, "forearm.R": {"rotation": (0, 0, 0.42)}}),
            (23, {**back_pose}),
        ],
        "research_cable": [
            (1, {**back_pose}),
            (8, {**back_pose, "spine": {"rotation": (0.34, 0, 0.30)}, "head": {**back_head, "rotation": (0.28, 0, -0.28)}, "upper_arm.L": {"rotation": (0.12, 0, 1.24)}, "forearm.L": {"rotation": (0.20, 0, 0.66)}}),
            (15, {**back_pose, "spine": {"rotation": (0.42, 0, 0.38)}, "forearm.L": {"rotation": (0.22, 0, 0.96)}}),
            (24, {**back_pose}),
        ],
        "research_sleep": [
            (1, {**back_pose}),
            (10, {**back_pose, "spine": {"rotation": (0.38, 0, -0.08)}, "head": {**back_head, "rotation": (0.48, 0, -0.12)}, "upper_arm.L": {"rotation": (0, 0, 0.18)}, "upper_arm.R": {"rotation": (0, 0, -0.18)}}),
            (22, {**back_pose, "spine": {"rotation": (0.46, 0, 0.08)}, "head": {**back_head, "rotation": (0.54, 0, 0.10)}}),
            (25, {**back_pose, "chair": {"rotation": (-0.10, 0, 0)}, "spine": {"rotation": (-0.42, 0, 0)}, "head": {**back_head, "rotation": (-0.32, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 1.12)}, "upper_arm.R": {"rotation": (0, 0, -1.12)}}),
            (34, {**back_pose}),
        ],
        "research_celebrate": [
            (1, {**back_pose}),
            (7, {**back_pose, "spine": {"rotation": (-0.24, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 1.42)}, "upper_arm.R": {"rotation": (0, 0, -1.42)}, "forearm.L": {"rotation": (0, 0, -0.38)}, "forearm.R": {"rotation": (0, 0, 0.38)}}),
            (14, {**back_pose, "chair": {"location": (0, 0, 0.10)}, "head": {**back_head, "rotation": (-0.20, 0, 0)}}),
            (22, {**back_pose}),
        ],
        "research_complete": [
            (1, {**back_pose}),
            (5, {**back_pose, "head": {**back_head, "rotation": (0, 0, -0.42)}, "spine": {"rotation": (-0.14, 0, 0.10)}}),
            (10, {**back_pose, "upper_arm.R": {"rotation": (-0.25, 0, -1.20)}, "forearm.R": {"rotation": (-0.20, 0, 0.76)}}),
            (13, {**back_pose, "spine": {"rotation": (-0.26, 0, -0.12)}, "forearm.R": {"rotation": (-0.30, 0, 0.30)}, "hand.R": {"scale": (1.30, 1.30, 1.30)}}),
            (21, {**back_pose}),
        ],
        "scroll_present": [
            (1, {}),
            (8, {"spine": {"rotation": (-0.18, 0, 0)}, "upper_arm.L": {"rotation": (0.12, 0, 1.20)}, "upper_arm.R": {"rotation": (-0.12, 0, -1.20)}, "forearm.L": {"rotation": (0, 0, -0.36)}, "forearm.R": {"rotation": (0, 0, 0.36)}}),
            (22, {"spine": {"rotation": (-0.12, 0, 0)}, "upper_arm.L": {"rotation": (0.10, 0, 1.08)}, "upper_arm.R": {"rotation": (-0.10, 0, -1.08)}}),
        ],
        "mail_notice": [
            (1, {}),
            (7, {"head": {"rotation": (-0.05, 0, -0.55)}, "spine": {"rotation": (-0.08, 0, -0.18)}}),
            (14, {"head": {"rotation": (0.12, 0, 0)}, "upper_arm.R": {"rotation": (0, 0, -0.74)}, "forearm.R": {"rotation": (0, 0, 0.66)}}),
            (22, {}),
        ],
        "mail_click": [
            (1, {}),
            (6, {"spine": {"rotation": (-0.20, 0, -0.20)}, "upper_arm.R": {"rotation": (-0.12, 0, -1.18)}, "forearm.R": {"rotation": (0.14, 0, -0.52)}}),
            (10, {"spine": {"rotation": (-0.28, 0, -0.26)}, "forearm.R": {"rotation": (0.10, 0, -0.82)}, "hand.R": {"scale": (1.18, 1.18, 1.18)}}),
            (18, {}),
        ],
        "defeat": [
            (1, {}),
            (9, {"chair": {"location": (0, 0, -0.10)}, "spine": {"rotation": (0.42, 0, 0)}, "head": {"rotation": (0.52, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, -0.22)}, "upper_arm.R": {"rotation": (0, 0, 0.22)}}),
            (26, {"chair": {"location": (0, 0, -0.14)}, "spine": {"rotation": (0.48, 0, 0)}, "head": {"rotation": (0.58, 0, 0)}}),
        ],
        "forbidden": [
            (1, {}),
            (7, {"chair": {"location": (0, 0, 0.12)}, "spine": {"rotation": (-0.20, 0, 0)}, "head": {"rotation": (-0.20, 0, 0)}, "upper_arm.L": {"rotation": (0, 0, 1.18)}, "upper_arm.R": {"rotation": (0, 0, -1.18)}}),
            (14, {"chair": {"location": (0, 0, 0.18)}, "head": {"rotation": (-0.10, 0, 0.22)}, "upper_arm.L": {"rotation": (0, 0, 1.42)}, "upper_arm.R": {"rotation": (0, 0, -1.42)}}),
            (24, {"chair": {"location": (0, 0, 0.10)}, "head": {"rotation": (-0.18, 0, -0.20)}}),
            (32, {}),
        ],
    })

    for action_name, keyframes in authored_actions.items():
        actions.append(create_action(armature, action_name, keyframes))
    return actions


def setup_preview(armature):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = True

    bpy.ops.object.light_add(type="AREA", location=(-3.5, -4.5, 6.0))
    key = bpy.context.active_object
    key.name = "PreviewKey"
    key.data.energy = 1000
    key.data.color = (0.22, 0.42, 1.0)
    key.data.shape = "DISK"
    key.data.size = 5

    bpy.ops.object.light_add(type="AREA", location=(3.0, -2.0, 3.8))
    fill = bpy.context.active_object
    fill.name = "PreviewFill"
    fill.data.energy = 760
    fill.data.color = (1.0, 0.12, 0.42)
    fill.data.size = 4

    bpy.ops.object.camera_add(location=(0, -10.2, 2.15))
    camera = bpy.context.active_object
    camera.name = "PreviewCamera"
    direction = Vector((0, 0, 1.90)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 56
    scene.camera = camera

    scene.world.color = (0.005, 0.004, 0.02)
    os.makedirs(os.path.dirname(PREVIEW_PATH), exist_ok=True)

    def render_action(action_name, frame, path):
        armature.animation_data.action = bpy.data.actions[action_name]
        scene.frame_set(frame)
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)

    render_action("idle", 1, PREVIEW_PATH)
    render_action("popup_swat", 12, SWAT_PREVIEW_PATH)
    render_action("reveal", 11, REVEAL_PREVIEW_PATH)

    camera.location = (7.4, -8.5, 2.10)
    direction = Vector((0, 0.05, 1.55)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    render_action("idle", 1, SIDE_PREVIEW_PATH)


def export_glb(armature, actions):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    armature.animation_data.action = None
    reset_pose(armature)
    bpy.context.scene.frame_set(1)
    bpy.ops.export_scene.gltf(
        filepath=MODEL_PATH,
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_optimize_animation_keep_anim_armature=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_skins=True,
        export_yup=True,
    )
    print("EXPORTED", MODEL_PATH)
    print("ACTIONS", ",".join(action.name for action in actions))


def main():
    clear_scene()
    scene = bpy.context.scene
    scene.render.fps = 24
    scene.render.fps_base = 1.0
    armature = create_rig()
    build_character(armature)
    actions = build_actions(armature)
    export_glb(armature, actions)
    if os.environ.get("SAGE_SKIP_PREVIEWS") != "1":
        setup_preview(armature)
        print("PREVIEWS", PREVIEW_PATH, SWAT_PREVIEW_PATH, REVEAL_PREVIEW_PATH, SIDE_PREVIEW_PATH)


if __name__ == "__main__":
    main()
