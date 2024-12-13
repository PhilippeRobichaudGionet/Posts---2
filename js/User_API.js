class User_API{
    static API_URL(){return "https://tin-stormy-peripheral.glitch.me/accounts/";}
    static GetUser_Url(){return "https://tin-stormy-peripheral.glitch.me/accounts/";}

    
    static async API_GetUsers() {
        return new Promise(resolve => {
            $.ajax({
                method:"get",
                url: this.API_URL(),
                headers: {
                    "Authorization": `Bearer ${ConnectedToken}`
                },
                success: users => resolve(users),
                error: (xhr) => { console.log(xhr); resolve(null); }
            });
        });
    }

    static async API_SaveUser(User, create) {
            $.ajax({
                url: create ? (this.API_URL() + "register") :  this.API_URL() + "modify",
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                headers: {
                    "Authorization": `Bearer ${ConnectedToken}`
                },
                data: JSON.stringify(User),
                success: (/*data*/) => { create ? $("#VerifyConnectInfo").text("Votre compte a été créé. Veuillez prendre votre courriels pour récupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion"):  resolve(true); },
                error: (xhr) => {$("#ConflictText").text(xhr[0]) }
            });
    }

    static async API_DeleteUser(id) {
        console.log(ConnectedToken);
            $.ajax({
                url: this.API_URL() + "remove/" + id,
                type: "GET",
                headers: {
                    "Authorization": `Bearer ${ConnectedToken}`
                },
                success: () => { console.log("Suppression du comopte réussi"); resolve(true); },
                error: (xhr) => { currentHttpError = xhr.responseJSON.error_description; resolve(false /*xhr.status*/); }
            });
    }

    static async BlockUser(id){
        $.ajax({
            type: "POST",
            url: this.API_URL() + "block/" + id,
            success: function (response) {
                
            }
        });
    }
    static async PromoteUser(id){
        $.ajax({
            type: "POST",
            url: this.API_URL() + "promote/" + id,
            success: function (response) {
                
            }
        });
    }
}
