
const getModel = (model_id) => {
    let model_name = "";
    switch (model_id){
        case 1:
            model_name = "KOURAI";
            break;
        case 2:
            model_name = "BOSON";
            break;
        case 3:
            model_name = "RHO";
            break;
        case 4:
            model_name = "KATAL";
            break;
        case 5:
            model_name = "HADION";
            break;
        case 6:
            model_name = "SPEKTRIX";
            break;
        case 7:
            model_name = "CORAX";
            break;
        case 8:
            model_name = "GROUNDSHOCK";
            break;
        case 9:
            model_name = "SKULL";
            break;
        case 10:
            model_name = "THERMO";
            break;
        case 11:
            model_name = "NUKE";
            break;
        case 12:
            model_name = "GUARDIAN";
            break;
        case 13:
            model_name = "__SOMECAR2";
            break;
        case 14:
            model_name = "BIGBANG";
            break;
        case 15:
            model_name = "FREEHWEEL";
            break;
        case 16:
            model_name = "X52";
            break;
        case 17:
            model_name = "X52ICE";
            break;
        case 18:
            model_name = "MXT";
            break;
        case 19:
            model_name = "CHARGER";
            break;
        case 20:
            model_name = "PHANTOM";
            break;
        default:
            model_name = "UNKNOWN";
            break;
    }
    return model_name;
}

module.exports = {
    getModel
}