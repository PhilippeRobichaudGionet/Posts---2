const Url = "https://tin-stormy-peripheral.glitch.me/token";
const UrlVerify = "https://tin-stormy-peripheral.glitch.me/accounts/verify";

//#region Connection
function TryConnect(Email,MDP){
    $.ajax({
        type: "POST",
        url: Url,
        data: JSON.stringify({ "Email": Email, "Password": MDP }),
        contentType: "application/json",
        success: function (response) {
            OnSuccessConnect(response.User);
            ConnectedToken = response.Access_token;
        },
        error: function (xhr, status, error) {
            if (xhr.responseJSON == undefined){
                OnErrorConnect("Le serveur ne répond pas");
            }else{
                OnErrorConnect(xhr.responseJSON.error_description);
            }
            
        }
    });
}
async function OnSuccessConnect(User){
    ConnectedUser = User;
    IsUserConnected = true;
    if (User.VerifyCode != "verified"){
        showVerifyCode();
    }
    else{
        await showPosts();
    }
}
function OnErrorConnect(ErrorMsg){
    $("#ErrorUserConnection").text(ErrorMsg);
}
//#endregion

//#region Disconnect
function DisconnectUser(){
    $.ajax({
        type: "get",
        url: "http://localhost:5000/accounts/logout/",
        headers: {
            "Authorization": `Bearer ${ConnectedToken}`
        },
        body: {
            Id : ConnectedUser.Id
        },
        success: function (response) {
            ConnectedToken = null
            IsUserConnected = false;
            ConnectedUser = null;
            console.log("Disconnect Successful " + response);
        },
        error: function (xhr){
            console.log(xhr);
        }
    });
}
//#endregion

//#region Verification
function VerifyCode(id, code) {
    $.ajax({
        type: "GET", // Matches server-side configuration
        url: UrlVerify, // Base URL
        data: { id: id, code: code }, // Pass parameters properly
        success: function (response) {
            OnSuccessCode(response);
        },
        error: function (xhr, status, error) {
            OnErrorCode(xhr);
        }
    });
}

async function OnSuccessCode(){
    await showPosts();
}

function OnErrorCode(ErrorMsg){
    console.log(ErrorMsg);
}
//#endregion
