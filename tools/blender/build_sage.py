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
    navy = material("robe_navy", (0.025, 0.055, 0.18), roughness=0.96)
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

    # An oversized racing-seat throne. Sage is intentionally too small for it.
    pieces.extend(
        [
            cube("ChairSeat", (0, -0.02, 0.96), (1.02, 0.76, 0.16), chair_pad, 0.11),
            cube("ChairSeatFront", (0, -0.72, 0.88), (0.94, 0.08, 0.13), chair_shell, 0.05),
            cube("ChairSeatTrim", (0, -0.81, 0.94), (0.80, 0.025, 0.035), chair_trim, 0.015),
            cube("ChairSeatShell", (0, 0.08, 0.78), (1.10, 0.82, 0.12), chair_shell, 0.10),
            cube("SeatBolsterL", (-0.91, -0.05, 1.08), (0.18, 0.70, 0.27), chair_shell, 0.08, (0, -0.08, -0.05)),
            cube("SeatBolsterR", (0.91, -0.05, 1.08), (0.18, 0.70, 0.27), chair_shell, 0.08, (0, 0.08, 0.05)),
            cube("ChairBack", (0, 0.50, 1.94), (1.05, 0.17, 1.14), chair_shell, 0.13),
            cube("ChairBackPad", (0, 0.30, 1.88), (0.69, 0.10, 0.86), chair_pad, 0.08),
            cube("ChairLumbar", (0, 0.15, 1.28), (0.58, 0.13, 0.23), hat_band, 0.09),
            cube("ChairHeadrest", (0, 0.26, 2.66), (0.62, 0.10, 0.27), chair_pad, 0.07),
            cube("ChairWingL", (-0.91, 0.39, 2.25), (0.23, 0.24, 0.72), chair_shell, 0.07, (0, -0.16, -0.12)),
            cube("ChairWingR", (0.91, 0.39, 2.25), (0.23, 0.24, 0.72), chair_shell, 0.07, (0, 0.16, 0.12)),
            cube("ChairPipeL", (-1.01, 0.29, 1.93), (0.035, 0.035, 1.01), chair_trim, 0.015, (0, 0, -0.015)),
            cube("ChairPipeR", (1.01, 0.29, 1.93), (0.035, 0.035, 1.01), chair_trim, 0.015, (0, 0, 0.015)),
            cube("HeadrestGlowL", (-0.27, 0.13, 2.69), (0.18, 0.025, 0.11), chair_trim, 0.035, (0, 0, -0.08)),
            cube("HeadrestGlowR", (0.27, 0.13, 2.69), (0.18, 0.025, 0.11), chair_trim, 0.035, (0, 0, 0.08)),
            cube("HeadrestCutoutL", (-0.27, 0.10, 2.69), (0.13, 0.020, 0.065), case_dark, 0.025, (0, 0, -0.08)),
            cube("HeadrestCutoutR", (0.27, 0.10, 2.69), (0.13, 0.020, 0.065), case_dark, 0.025, (0, 0, 0.08)),
            cylinder("ArmPostL", (-1.10, -0.02, 1.16), 0.07, 0.48, chair_metal, 8),
            cylinder("ArmPostR", (1.10, -0.02, 1.16), 0.07, 0.48, chair_metal, 8),
            cube("ArmRestL", (-1.10, -0.18, 1.39), (0.17, 0.44, 0.09), chair_pad, 0.045),
            cube("ArmRestR", (1.10, -0.18, 1.39), (0.17, 0.44, 0.09), chair_pad, 0.045),
            cylinder("ReclineHingeL", (-1.05, 0.20, 0.86), 0.18, 0.12, chair_metal, 10, (math.pi / 2, 0, 0)),
            cylinder("ReclineHingeR", (1.05, 0.20, 0.86), 0.18, 0.12, chair_metal, 10, (math.pi / 2, 0, 0)),
            cylinder("ReclineGlowL", (-1.05, 0.13, 0.86), 0.095, 0.025, chair_trim, 10, (math.pi / 2, 0, 0)),
            cylinder("ReclineGlowR", (1.05, 0.13, 0.86), 0.095, 0.025, chair_trim, 10, (math.pi / 2, 0, 0)),
            cylinder("ChairStem", (0, 0.16, 0.48), 0.15, 0.58, chair_metal, 8),
            torus("ChairHoverRing", (0, 0.16, 0.24), 0.72, 0.075, chair_trim),
            cone("ChairThruster", (0, 0.16, -0.11), 0.22, 0.48, 0.52, magic, 8),
        ]
    )
    for index in range(5):
        angle = index * math.tau / 5
        pieces.append(
            cube(
                f"HoverFin{index}",
                (math.cos(angle) * 0.47, 0.16 + math.sin(angle) * 0.47, 0.25),
                (0.42, 0.075, 0.045),
                chair_metal,
                0.025,
                (0, 0, angle),
            )
        )
    for piece in pieces:
        parent_to_bone(piece, armature, "chair")

    # Seated torso, lap, and boots. No intersecting belt or robe-hem meshes.
    pelvis_parts = [
        cone(
            "RobeTorso",
            occupant_point((0, 0.14, 1.52)),
            0.33 * OCCUPANT_SCALE,
            0.55 * OCCUPANT_SCALE,
            0.72 * OCCUPANT_SCALE,
            navy,
            8,
        ),
        cube("RobeLap", occupant_point((0, -0.14, 1.12)), scaled_shape((0.57, 0.46, 0.18)), navy, 0.07, (-0.10, 0, 0)),
        cube("RobeLapTrim", occupant_point((0, -0.56, 1.09)), scaled_shape((0.50, 0.035, 0.07)), robe_edge, 0.018, (-0.10, 0, 0)),
        cube("LegL", (-0.22, -0.60, 0.96), (0.11, 0.27, 0.09), navy, 0.035, (-0.30, 0, -0.03)),
        cube("LegR", (0.22, -0.60, 0.96), (0.11, 0.27, 0.09), navy, 0.035, (-0.30, 0, 0.03)),
        cube("BootL", (-0.22, -0.91, 0.86), (0.17, 0.18, 0.11), boot_mat, 0.045, (-0.18, 0, -0.055)),
        cube("BootR", (0.22, -0.91, 0.86), (0.17, 0.18, 0.11), boot_mat, 0.045, (-0.18, 0, 0.055)),
        cube("BootSoleL", (-0.22, -1.06, 0.77), (0.18, 0.055, 0.035), case_dark, 0.018, (-0.18, 0, -0.055)),
        cube("BootSoleR", (0.22, -1.06, 0.77), (0.18, 0.055, 0.035), case_dark, 0.018, (-0.18, 0, 0.055)),
    ]
    for piece in pelvis_parts:
        parent_to_bone(piece, armature, "pelvis")

    shoulder_parts = [
        sphere("ShoulderL", occupant_point((-0.48, 0, 1.76)), scaled_shape((0.26, 0.28, 0.24)), navy),
        sphere("ShoulderR", occupant_point((0.48, 0, 1.76)), scaled_shape((0.26, 0.28, 0.24)), navy),
    ]
    for piece in shoulder_parts:
        parent_to_bone(piece, armature, "spine")

    # Rigid low-poly arms follow the armature bones.
    arm_specs = [
        ("UpperArmL", (-0.57, 0, 1.70), 0.17, 0.58, "upper_arm.L", (0, math.pi / 2 - 0.30, 0)),
        ("ForearmL", (-0.91, -0.01, 1.51), 0.14, 0.44, "forearm.L", (0, math.pi / 2 - 0.75, 0)),
        ("UpperArmR", (0.57, 0, 1.70), 0.17, 0.58, "upper_arm.R", (0, math.pi / 2 + 0.30, 0)),
        ("ForearmR", (0.91, -0.01, 1.51), 0.14, 0.44, "forearm.R", (0, math.pi / 2 + 0.75, 0)),
    ]
    for name, location, radius, depth, bone, rotation in arm_specs:
        part = cylinder(
            name,
            occupant_point(location),
            radius * OCCUPANT_SCALE,
            depth * OCCUPANT_SCALE,
            navy,
            8,
            rotation,
        )
        parent_to_bone(part, armature, bone)

    # Mario 64-style ball hands avoid intersecting finger cylinders during large poses.
    for side, x in (("L", -1.16), ("R", 1.16)):
        hand = sphere(
            f"Hand{side}",
            occupant_point((x, -0.04, 1.31)),
            scaled_shape((0.26, 0.21, 0.26), HEAD_SCALE),
            glove,
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
        cube("MonitorNeck", occupant_point((0, 0, 1.96)), scaled_shape((0.17, 0.20, 0.16), HEAD_SCALE), case_dark, 0.032),
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

    # Crooked wizard hat. The clean brim keeps its silhouette free of stray nubs.
    hat_parts = [
        cylinder("HatBrim", occupant_point((0, -0.01, 2.91)), 0.80 * HAT_SCALE, 0.10 * HAT_SCALE, hat, 12, (0.03, 0.08, -0.05)),
        cone("HatCrown", occupant_point((0.03, 0.04, 3.25)), 0.30 * HAT_SCALE, 0.67 * HAT_SCALE, 0.66 * HAT_SCALE, hat, 10, (0.02, 0.10, -0.04)),
        cone("HatBend", occupant_point((0.13, 0.05, 3.65)), 0.15 * HAT_SCALE, 0.32 * HAT_SCALE, 0.48 * HAT_SCALE, hat, 9, (0.02, 0.38, -0.13)),
        cone("HatTip", occupant_point((0.30, 0.04, 3.90)), 0.015 * HAT_SCALE, 0.17 * HAT_SCALE, 0.35 * HAT_SCALE, hat, 8, (0.04, 0.65, -0.16)),
        torus("HatBand", occupant_point((0.02, 0.01, 3.01)), 0.57 * HAT_SCALE, 0.055 * HAT_SCALE, hat_band, (0.03, 0.08, -0.05)),
        cube("HatStarLargeV", occupant_point((0.18, -0.58, 3.23)), scaled_shape((0.025, 0.018, 0.095), HAT_SCALE), amber, 0.008, (0, 0, 0.18)),
        cube("HatStarLargeH", occupant_point((0.18, -0.58, 3.23)), scaled_shape((0.085, 0.018, 0.025), HAT_SCALE), amber, 0.008, (0, 0, 0.18)),
        cube("HatStarSmallV", occupant_point((-0.24, -0.53, 3.10)), scaled_shape((0.018, 0.018, 0.06), HAT_SCALE), amber, 0.006, (0, 0, -0.15)),
        cube("HatStarSmallH", occupant_point((-0.24, -0.53, 3.10)), scaled_shape((0.055, 0.018, 0.018), HAT_SCALE), amber, 0.006, (0, 0, -0.15)),
    ]
    for piece in hat_parts:
        parent_to_bone(piece, armature, "head")

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
    for frame, pose in keyframes:
        apply_pose(armature, pose)
        for bone in armature.pose.bones:
            bone.keyframe_insert(data_path="location", frame=frame, group=bone.name)
            bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone.name)
            bone.keyframe_insert(data_path="scale", frame=frame, group=bone.name)
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = interpolation
    action["pose_rate"] = 12 if interpolation == "CONSTANT" else 24
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
                (7, {"chair": {"location": (0, 0, 0.025)}, "head": {"rotation": (0.02, 0, -0.025)}}),
                (13, {"chair": {"location": (0, 0, 0.055)}, "spine": {"rotation": (0.015, 0, 0.018)}}),
                (19, {"chair": {"location": (0, 0, 0.02)}, "head": {"rotation": (-0.015, 0, 0.03)}}),
                (25, {}),
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
            "popup_swat",
            [
                (1, {}),
                (5, {"head": {"rotation": (0, 0, -0.42)}, "spine": {"rotation": (0.02, 0, -0.12)}}),
                (9, {"spine": {"rotation": (0.08, 0, 0.28)}, "head": {"rotation": (0, 0, -0.58)}, "upper_arm.R": {"rotation": (0.2, -0.25, 1.25)}, "forearm.R": {"rotation": (-0.1, 0.25, 1.1)}}),
                (12, {"spine": {"rotation": (-0.24, 0, -0.36)}, "head": {"rotation": (0.08, 0, 0.22)}, "upper_arm.R": {"rotation": (-0.2, 0.25, -1.4)}, "forearm.R": {"rotation": (0.2, -0.25, -0.85)}}),
                (14, {"spine": {"rotation": (-0.16, 0, -0.24)}, "upper_arm.R": {"rotation": (-0.1, 0.1, -0.95)}, "forearm.R": {"rotation": (0.15, -0.2, -0.62)}}),
                (21, {"head": {"rotation": (0, 0, 0.08)}}),
                (27, {}),
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
    setup_preview(armature)
    print("PREVIEWS", PREVIEW_PATH, SWAT_PREVIEW_PATH, REVEAL_PREVIEW_PATH, SIDE_PREVIEW_PATH)


if __name__ == "__main__":
    main()
