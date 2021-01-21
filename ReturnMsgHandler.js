/*
This function handles all the messages that are returned by the cars
 */

const handleReturnMsg = (data, isNot, vehicle, client, eventEmitter) => {
    let messageID = data.readUInt8(1);
    let isReverse = false;

    switch (messageID){
        case 23:
            /*
            Ping Response
             */
            client.publish("Anki/Car/" + vehicle.id + "/S/PingResp", JSON.stringify({
                    "timestamp": Date.now
                }
            ), {
                "retain": true,
                "qos": 1
            });
            break;
        case 25:
            /*
            Version Response
             */
            let version = data.readUInt16LE(2);
            client.publish("Anki/Car/" + vehicle.id + "/S/Version", JSON.stringify({
                    "timestamp": Date.now,
                    "value": version
                }
            ), {
                "retain": true,
                "qos": 1
            });
            break;
        case 27:
            /*
            Battery Status Response
             */
            let level = data.readUInt16LE(2);
            client.publish("Anki/Car/" + vehicle.id + "/S/BatteryLevel", JSON.stringify({
                    "timestamp": Date.now,
                    "value": level
                }
            ), {
                "retain": true,
                "qos": 1
            });
            break;
        case 39:
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
            }), {
                "retain": true,
                "qos": 1
            })

            client.publish("Anki/Car/" + vehicle.id + "/S/Speed/Actual", JSON.stringify({
                "timestamp": Date.now(),
                "value": speed
            }), {
                "retain": true,
                "qos": 1
            })

            client.publish("Anki/Car/" + vehicle.id + "/E/lane/offset/actual", JSON.stringify({
                "timestamp": Date.now(),
                "value": offset_pos
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/lane/desired_lane_change_speed", JSON.stringify({
                "timestamp": Date.now(),
                "value": pieceLocation
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/speed", JSON.stringify({
                "timestamp": Date.now(),
                "value": speed
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/last_desired_speed", JSON.stringify({
                "timestamp": Date.now(),
                "value": last_des_speed
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/track_piece_id", JSON.stringify({
                "timestamp": Date.now(),
                "value": pieceId
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/track_location_id", JSON.stringify({
                "timestamp": Date.now(),
                "value": pieceLocation
            }))
            break;
        case 41:
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


            client.publish("Anki/Car/" + vehicle.id + "/E/lane/offset/actual", JSON.stringify({
                "timestamp": Date.now(),
                "value": offset_trans
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/lane/desired_lane_change_speed", JSON.stringify({
                "timestamp": Date.now(),
                "value": last_desired_lane_change_speed_mm_per_sec
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/ave_follow_line_drift_pixels", JSON.stringify({
                "timestamp": Date.now(),
                "value": ave_follow_line_drift_pixels
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/had_lane_change_activity", JSON.stringify({
                "timestamp": Date.now(),
                "value": had_lane_change_activity
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/uphill_counter", JSON.stringify({
                "timestamp": Date.now(),
                "value": uphill_counter
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/downhill_counter", JSON.stringify({
                "timestamp": Date.now(),
                "value": downhill_counter
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/left_wheel_dist_cm", JSON.stringify({
                "timestamp": Date.now(),
                "value": left_wheel_dist_cm
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/right_wheel_dist_cm", JSON.stringify({
                "timestamp": Date.now(),
                "value": right_wheel_dist_cm
            }))
            break;
        case 42:
            let road_piece_idx_intersection = data.readInt8(2);
            let offset = data.readFloatLE(3);
            let intersection_code = data.readUInt8(7);
            let is_exiting = data.readUInt8(8);
            let mm_since_last_transition_bar = data.readUInt16LE(9);
            let mm_since_last_intersection_code = data.readUInt16LE(11);


            console.log(vehicle.id + "Message_id: "  + "\n"
                + messageID + "\n"
                + " road_piece_idx: " + data.readInt8(2) + "\n"
                + " offset: " + data.readFloatLE(3) + "\n"
                + " intersection_code: " + data.readUInt8(7) + "\n"
                + " is_exiting: " + data.readUInt8(8) + "\n"
                + " mm_transition_bar: " + data.readUInt16LE(9) + "\n"
                + " mm_insection_code: " + data.readUInt16LE(11)); + "\n"

            client.publish("Anki/Car/" + vehicle.id + "/E/lane/offset/actual", JSON.stringify({
                "timestamp": Date.now(),
                "value": offset
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/intersection_code", JSON.stringify({
                "timestamp": Date.now(),
                "value": intersection_code
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/mm_since_last_transition_bar", JSON.stringify({
                "timestamp": Date.now(),
                "value": mm_since_last_transition_bar
            }))

            client.publish("Anki/Car/" + vehicle.id + "/E/mm_since_last_intersection_code", JSON.stringify({
                "timestamp": Date.now(),
                "value": mm_since_last_intersection_code
            }))
            break;
        case 43:
            client.publish("Anki/Car/" + vehicle.id + "/E/Delocalized", JSON.stringify({
                    "timestamp": Date.now()
                }
            ));
            break;
        case 45:
            let offset_update = data.readFloatLE(2);
            
            break;
        case 63:
            let isOnTrack = data.readUInt8(2);
            let isCharging = data.readUInt8(3)
            client.publish("Anki/Car/" + vehicle.id + "/S/CarStatus", JSON.stringify({
                "timestamp": Date.now(),
                "online": true,
                "charging": isCharging,
                "onTrack": isOnTrack
            }), {
                "retain": true,
                "qos": 1
            })
            break;
        default:
            //Not definded :/ pls ignore thx
            break;
    }
}

module.exports = {
    handleReturnMsg
}