const handleReturnMsg = (data, isNot, vehicle, client, eventEmitter) => {
    let messageID = data.readUInt8(1);
    let isReverse = false;

    switch (messageID){
        case 23:
            // Ping Responses
            eventEmitter.emit('pingEvent', vehicle)
            break;
        case 25:
            // Version received
            let version = data.readUInt16(2);
            client.publish("Anki/Car/" + vehicle.id + "/S/Version", JSON.stringify({
                    "timestamp": Date.now,
                    "value": version
                }
            ));
            break;
        case 27:
            // Battery Level received
            let level = data.readUInt16(2);
            client.publish("Anki/Car/" + vehicle.id + "/S/BatteryLevel", JSON.stringify({
                    "timestamp": Date.now,
                    "value": level
                }
            ));
            break;
        case 39:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_POSITION_UPDATE
            let pieceLocation = data.readUInt8(2);
            let pieceId = data.readUInt8(3);
            let offset_pos = data.readFloatLE(4);
            let speed = data.readUInt16LE(8);
            let flag = data.readUInt8(10);
            let last_rec_lane_change_cmd_id = data.readUInt8(11);
            let last_exe_lane_change_cmd_id = data.readUInt8(12);
            let last_des_lane_change_speed = data.readUInt16LE(13);
            let last_des_speed = data.readUInt16LE(15);

            if (flag.toString(16) === "0x40") isReverse = true;

            console.log("Vehicle ID: " + vehicle.id + "\n"
                + " Message_id: " + messageID + "\n"
                + ' offset: '  + offset_pos + "\n"
                + ' speed: ' + speed + "\n"
                + " flag: " + flag + "\n"
                + ' - pieceId: '  + pieceId + "\n"
                + ' pieceLocation: ' + pieceLocation + "\n"
                + " last_rec_lane_change_cmd: " + last_rec_lane_change_cmd_id + "\n"
                + " last_exe_lane_change_cmd: " + last_exe_lane_change_cmd_id + "\n"
                + " last_des_lane_change_speed: " + last_des_lane_change_speed + "\n"
                + " last_des_speed: " + last_des_speed  + "\n" );

            client.publish("Anki/Car/" + vehicle.id + "/S/Lane/Actual", JSON.stringify({
                "timestamp": Date.now(),
                "value": offset_pos
            }))

            client.publish("Anki/Car/" + target + "/S/Speed/Actual", JSON.stringify({
                "timestamp": Date.now(),
                "value": speed
            }))

            client.publish("Anki/Car/" + vehicle.id + "/S/PositionInfo", JSON.stringify({
                    "timestamp": Date.now(),
                    "locationId": pieceLocation,
                    "roadPieceId": pieceId,
                   // "reverse": isReverse,
                    "lane": offset_pos,
                    "speed": speed,
                    "lastDesSpeed": last_des_speed
                }
            ));
            break;
        case 41:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_TRANSITION_UPDATE
            let road_piece_idx = data.readInt8(2);
            let road_piece_idx_prev = data.readInt8(3);
            let offset_trans = data.readFloatLE(4);
            let last_recv_lane_change_id = data.readUInt8(8);
            let last_exec_lane_change_id = data.readUInt8(9);
            let last_desired_lane_change_speed_mm_per_sec = data.readUInt16LE(10);
            let ave_follow_line_drift_pixels = data.readInt8(12);
            let had_lane_change_activity = data.readUInt8(13);
            let uphill_counter = data.readUInt8(14);
            let downhill_counter = data.readUInt8(15);
            let left_wheel_dist_cm = data.readUInt8(16);
            let right_wheel_dist_cm = data.readUInt8(17);

            console.log("Vehicle ID " + vehicle.id + "\n"
                + "Message_id: " + messageID + "\n"
                + " road_piece_idx: " + road_piece_idx + "\n"
                + " road_piece_idx_prev: " + road_piece_idx_prev + "\n"
                + ' offset: '  + offset_trans + "\n"
                + ' last_recv_lane_change_id: '  + last_recv_lane_change_id + "\n"
                + ' last_exec_lane_change_id: '  + last_exec_lane_change_id + "\n"
                + ' last_desired_lane_change_speed_mm_per_sec: '  + last_desired_lane_change_speed_mm_per_sec + "\n"
                + ' ave_follow_line_drift_pixels: '  + ave_follow_line_drift_pixels + "\n"
                + ' had_lane_change_activity: '  + had_lane_change_activity + "\n"
                + ' uphill_counter: '  + uphill_counter + "\n"
                + ' downhill_counter: '  + downhill_counter + "\n"
                + ' left_wheel_dist_cm: '  + left_wheel_dist_cm + "\n"
                + ' right_wheel_dist_cm: '  + right_wheel_dist_cm + "\n"
            );

            client.publish("Anki/Car/" + vehicle.id + "/S/TransitionInfo", JSON.stringify({
                    "timestamp": Date.now,
                    "roadPieceId": road_piece_idx,
                    "prevRoadPieceId": road_piece_idx_prev,
                    "lane": offset_trans,
                }
            ));
            break;
        case 42:
            //  ANKI_VEHICLE_MSG_V2C_LOCALIZATION_INTERSECTION_UPDATE
            let road_piece_idx_intersection = data.readInt8(2);
            let offset = data.readFloatLE(3);
            let intersection_code = data.readUInt8(7);
            let is_exiting = data.readUInt8(8);
            let mm_transition_bar = data.readUInt16LE(9);
            let mm_intersection_code = data.readUInt16LE(11);

            console.log(vehicle.id + "Message_id: "  + "\n"
                + messageID + "\n"
                + " road_piece_idx: " + data.readInt8(2) + "\n"
                + " offset: " + data.readFloatLE(3) + "\n"
                + " intersection_code: " + data.readUInt8(7) + "\n"
                + " is_exiting: " + data.readUInt8(8) + "\n"
                + " mm_transition_bar: " + data.readUInt16LE(9) + "\n"
                + " mm_insection_code: " + data.readUInt16LE(11)); + "\n"

            client.publish("Anki/Car/" + vehicle.id + "/S/IntersectionInfo", JSON.stringify({
                    "timestamp": Date.now(),
                    "intersectionCode": intersection_code,
                    "isExiting": is_exiting
                }
            ));
            break;
        case 43:
            // ANKI_VEHICLE_MSG_V2C_VEHICLE_DELOCALIZED
            client.publish("Anki/Car/" + vehicle.id + "/E/Delocalized", JSON.stringify({
                    "timestamp": Date.now()
                }
            ));
            break;
        case 45:
            // ANKI_VEHICLE_MSG_V2C_OFFSET_FROM_ROAD_CENTER_UPDATE
            let offset_update = data.readFloatLE(2);
            client.publish("controller/offset_update", JSON.stringify({
                    "command": "trams_update_res",
                    "target": vehicle.id,
                    "data": {
                        "offset": offset_update
                    }
                }
            ));
            break;
        case 63:
            let isOnTrack = data.readUInt8(2);
            let isCharging = data.readUInt8(3)
            client.publish("Anki/Car/" + vehicle.id + "/S/CarStatus", JSON.stringify({
                "timestamp": Date.now(),
                "online": true,
                "charging": isOnTrack,
                "onTrack": isCharging
            }))
            break;
        default:
            // Not definded
            break;
    }
}

module.exports = {
    handleReturnMsg
}