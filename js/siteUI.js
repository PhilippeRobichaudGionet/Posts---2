////// Author: Nicolas Chourot
////// 2024
//////////////////////////////

const periodicRefreshPeriod = 2;
const waitingGifTrigger = 2000;
const minKeywordLenth = 3;
const keywordsOnchangeDelay = 500;

let categories = [];
let selectedCategory = "";
let currentETag = "";
let currentPostsCount = -1;
let periodic_Refresh_paused = false;
let postsPanel;
let itemLayout;
let waiting = null;
let showKeywords = false;
let keywordsOnchangeTimger = null;

//User Data
let ConnectedUser = null;
let IsUserConnected = false;
let ConnectedToken = null;

Init_UI();
async function Init_UI() {
    postsPanel = new PageManager('postsScrollPanel', 'postsPanel', 'postSample', renderPosts);
    $('#createPost').on("click", async function () {
        showCreatePostForm();
    });
    $('#abort').on("click", async function () {
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $("#showSearch").on('click', function () {
        toogleShowKeywords();
        showPosts();
    });
    $("#SubmitInput").click(function () {
        TryConnect($("#EmailInput").val(), $("#MDPInput").val());
    });
    $("#ConfirmVerifyCodeBtn").click(function (event) {
        VerifyCode($("#id").val(), $("#VerifyValue").val());
    });
    //Not Connected
    $("#CreateUserBtn").click(function () {
        showCreateModifUser();
    });
    $("#PostShower").click(function (){
        showPosts();
    });
    installKeywordsOnkeyupEvent();
    postsPanel.hide();
    ShowConnection();
}

/////////////////////////// Search keywords UI //////////////////////////////////////////////////////////

function installKeywordsOnkeyupEvent() {
    $("#searchKeys").on('keyup', function () {
        clearTimeout(keywordsOnchangeTimger);
        keywordsOnchangeTimger = setTimeout(() => {
            cleanSearchKeywords();
            showPosts(true);
        }, keywordsOnchangeDelay);
    });
    $("#searchKeys").on('search', function () {
        showPosts(true);
    });
}
function cleanSearchKeywords() {
    /* Keep only keywords of 3 characters or more */
    let keywords = $("#searchKeys").val().trim().split(' ');
    let cleanedKeywords = "";
    keywords.forEach(keyword => {
        if (keyword.length >= minKeywordLenth) cleanedKeywords += keyword + " ";
    });
    $("#searchKeys").val(cleanedKeywords.trim());
}
function showSearchIcon() {
    $("#hiddenIcon").hide();
    $("#showSearch").show();
    if (showKeywords) {
        $("#searchKeys").show();
    }
    else
        $("#searchKeys").hide();
}
function hideSearchIcon() {
    $("#hiddenIcon").show();
    $("#showSearch").hide();
    $("#searchKeys").hide();
}
function toogleShowKeywords() {
    showKeywords = !showKeywords;
    if (showKeywords) {
        $("#searchKeys").show();
        $("#searchKeys").focus();
    }
    else {
        $("#searchKeys").hide();
        showPosts(true);
    }
}

/////////////////////////// Views management ////////////////////////////////////////////////////////////

function intialView() {
    $("#createPost").show;
    $("#hiddenIcon").hide();
    $("#ConnectContainer").hide();
    $("#hiddenIcon2").hide();
    $('#menu').show();
    $('#commit').hide();
    $('#abort').hide();
    $('#form').hide();
    $('#form').empty();
    $('#aboutContainer').hide();
    $('#errorContainer').hide();
    showSearchIcon();
}
async function showPosts(reset = false) {
    intialView();
    $("#viewTitle").text("Fil de nouvelles");
    $("#ConnectContainer").hide();    
    periodic_Refresh_paused = false;
    await postsPanel.show(reset);
}
async function ShowPostsNotConnected(reset = false){
    intialView();
    $("#viewTitle").text("Fil de nouvelles");
    $("#ConnectContainer").hide();
    let DDMenu = $("#DDMenu");
    DDMenu.empty();
    DDMenu.append(`<div class="dropdown-item menuItemLayout" id="ConnectionMenu"><i class="fa-brands fa-connectdevelop"></i>Connexion</div>`);
    periodic_Refresh_paused = false;
    await postsPanel.show(reset);
}
function HideConnectionElem() {
    $("postsScrollPanel").hide();
    $("#hiddenIcon").hide();
    $("#hiddenIcon2").hide();
    $("#VerifyContainer").hide();
    $('#menu').show();
    $('#commit').hide();
    $('#abort').hide();
    $('#form').hide();
    $('#form').empty();
    $('#aboutContainer').hide();
    $('#errorContainer').hide();
    $('#showSearch').hide();
    $("#createPost").hide();
    $("#searchKeys").hide();
}
function ShowConnection(AjaxMsg = "") {
    if (AjaxMsg != ""){
        $("#VerifyConnectInfo").text(AjaxMsg);
    }
    $('#content > :not(#ConnectContainer)').hide();
    $("#ConnectContainer").show();
    HideConnectionElem()
}
function hidePosts() {
    postsPanel.hide();
    hideSearchIcon();
    $("#createPost").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;
}
function showForm() {
    hidePosts();
    $('#form').show();
    $('#commit').show();
    $('#abort').show();
}
function showError(message, details = "") {
    hidePosts();
    $('#form').hide();
    $('#form').empty();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#commit').hide();
    $('#abort').show();
    $("#viewTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append($(`<div>${message}</div>`));
    $("#errorContainer").append($(`<div>${details}</div>`));
}
function showVerifyCode() {
    $("#VerifyContainer").show();
    $("#ConnectContainer").hide()
    $("#id").val(ConnectedUser.Id);
}
function showCreatePostForm() {
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    renderPostForm();
}
function showEditPostForm(id) {
    showForm();
    $("#viewTitle").text("Modification");
    renderEditPostForm(id);
}
function showDeletePostForm(id) {
    showForm();
    $("#viewTitle").text("Retrait");
    renderDeletePostForm(id);
}
function showCreateModifUser(User = null) {
    showForm();
    if (User == null) {
        $("#viewTitle").text("Inscription");
        renderUserForm();
    }
    else {
        $("#viewTitle").text("Modification");
        renderUserForm(User);
    }
}
function showAbout() {
    hidePosts();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#abort').show();
    $("#viewTitle").text("À propos...");
    $("#aboutContainer").show();
}
async function showGestionUser() {
    $('#content > :not(#UserManager)').hide();
    $("#UserManager").show();
    $("#viewTitle").text("Gestion des usagers");
    let listUser = await User_API.API_GetUsers();
    listUser.forEach(user => {
        $("#UserManager").append(`
            <br>
            <div>
                <img src="${user.Avatar}" alt="AvatarIMG" class="UserAvatarXSmall"/>${user.Name}
                <i class="fa-solid fa-eraser" onclick="User_API.BlockUser(${user.id})"></i>
                <i class="fa-solid fa-ban" onclick="User_API.PromoteUser(${user.id})"></i>
            </div>
        `);
    });
}
function showSup(){
    $('#content > :not(#SuppContainer)').hide();
    $("#SuppContainer").show();

    $("#EraseBtn").click(function (){
        User_API.API_DeleteUser(ConnectedUser.Id);
    });
    $("#CancelBtn").click(function (){
        showForm();
        if (User == null) {
            $("#viewTitle").text("Inscription");
            renderUserForm();
        }
        else {
            $("#viewTitle").text("Modification");
            renderUserForm(ConnectedUser);
        }
    });
}
//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

function start_Periodic_Refresh() {
    $("#reloadPosts").addClass('white');
    $("#reloadPosts").on('click', async function () {
        $("#reloadPosts").addClass('white');
        postsPanel.resetScrollPosition();
        await showPosts();
    })
    setInterval(async () => {
        if (!periodic_Refresh_paused) {
            let etag = await Posts_API.HEAD();
            if (currentETag != etag) {
                            // the etag contain the number of model records in the following form
            // xxx-etag
            let postsCount = parseInt(etag.split("-")[0]);        
                if (postsCount != currentPostsCount) {
                    console.log("postsCount", postsCount)
                    currentPostsCount = postsCount;
                    $("#reloadPosts").removeClass('white');
                } else
                    await showPosts();
                currentETag = etag;
            }
        }
    },
        periodicRefreshPeriod * 1000);
}
async function renderPosts(queryString) {
    let endOfData = false;
    queryString += "&sort=date,desc";
    compileCategories();
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    if (showKeywords) {
        let keys = $("#searchKeys").val().replace(/[ ]/g, ',');
        if (keys !== "")
            queryString += "&keywords=" + $("#searchKeys").val().replace(/[ ]/g, ',')
    }
    addWaitingGif();
    let response = await Posts_API.GetQuery(queryString);
    if (!Posts_API.error) {
        currentETag = response.ETag;
        currentPostsCount = parseInt(currentETag.split("-")[0]);
        let Posts = response.data;
        if (Posts.length > 0) {
            Posts.forEach(Post => {
                postsPanel.append(renderPost(Post));
            });
        } else
            endOfData = true;
        linefeeds_to_Html_br(".postText");
        highlightKeywords();
        attach_Posts_UI_Events_Callback();
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
function renderPost(post, CurrentLike = true) {
    let date = convertToFrenchDate(UTC_To_Local(post.Date));
    let crudIcon =
        `
        <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
        <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
        `;
    let LikeIcon = "";
    if (IsUserConnected) {
        if (CurrentLike) {
            LikeIcon = `<i class="fa-solid fa-thumbs-up"></i>`
        }
        else {
            LikeIcon = `<i class="fa-regular fa-thumbs-up" ></i>`
        }
    }
    return $(`
        <div class="post" id="${post.Id}">
            <div class="postHeader">
                ${post.Category}
                ${crudIcon}
                ${LikeIcon}
            </div>
            <div class="postTitle"> ${post.Title} </div>
            <img class="postImage" src='${post.Image}'/>
            <div class="postDate"> ${date} </div>
            <div postId="${post.Id}" class="postTextContainer hideExtra">
                <div class="postText" >${post.Text}</div>
            </div>
            <div class="postfooter">
                <span postId="${post.Id}" class="moreText cmdIconXSmall fa fa-angle-double-down" title="Afficher la suite"></span>
                <span postId="${post.Id}" class="lessText cmdIconXSmall fa fa-angle-double-up" title="Réduire..."></span>
            </div>         
        </div>
    `);
}
async function compileCategories() {
    categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            if (!categories.includes(selectedCategory))
                selectedCategory = "";
            updateDropDownMenu(categories);
        }
    }
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    //#region Profil if Connected
    if (ConnectedUser != null) {
        DDMenu.append(`
                <div>
                    <img src="${ConnectedUser.Avatar}" alt="AvatarIMG" class="UserAvatarXSmall"/>${ConnectedUser.Name}
                </div>
            `);
        DDMenu.append($(`<div class="dropdown-divider"></div> `));
    }
    //#endregion

    //#region Profil is Admin
    if (ConnectedUser != null){
        if (ConnectedUser.Authorizations.readAccess == 3 && ConnectedUser.Authorizations.writeAccess == 3) {
            DDMenu.append($(`<div class="dropdown-item menuItemLayout" id="GestionUsers"><i class="fa-solid fa-users-rectangle"></i>Gestions des usagers</div>`));
            DDMenu.append($(`<div class="dropdown-divider"></div>`));
            DDMenu.append($(`<div class="dropdown-divider"></div> `));
        }
    }
    //#endregion

    //#region réaction ou Modifcation de compte de User
    if (!IsUserConnected) {
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="CreateUser">
                <i class="fa-solid fa-user-plus"></i>Créer Profil
            </div>
        `));
    } else {
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="ModifUser">
                <i class="fa-solid fa-users-gear"></i>Modification Profil
            </div>
        `));
    }
    //#endregion
    
    //#region Connexion - Déconnexion
    if (IsUserConnected) {
        DDMenu.append($(`<div class="dropdown-item menuItemLayout" id="DeconnectMenu"><i class="menuIcon fa fa-sign-in mx-2"></i>Déconnexion</div>`));
    }
    else{
        DDMenu.append(`<div class="dropdown-item menuItemLayout" id="ConnectionMenu"><i class="fa-brands fa-connectdevelop"></i>Connexion</div>`);
    }
    //#endregion

    DDMenu.append($(`<div class="dropdown-divider"></div> `));

    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })

    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    //À propos
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
    `));

    //#region OnClick DropDown Menu
    if (!IsUserConnected) {
        $('#CreateUser').on("click", function () {
            showCreateModifUser();
        });
    } else {
        $('#ModifUser').on("click", function () {
            showCreateModifUser(ConnectedUser);
        });
    }
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $('#allCatCmd').on("click", async function () {
        selectedCategory = "";
        await showPosts(true);
        updateDropDownMenu();
    });
    $('.category').on("click", async function () {
        selectedCategory = $(this).text().trim();
        await showPosts(true);
        updateDropDownMenu();
    });
    $("#GestionUsers").click(function () {
        showGestionUser();
    });
    $("#DeconnectMenu").click(function (){
        DisconnectUser(ConnectedUser.Id)
        ShowConnection();
    });
    $("#ConnectionMenu").click(function () {
        let DDMenu = $("#DDMenu");
        DDMenu.empty();
        DDMenu.append(`<div class="dropdown-item menuItemLayout" id="PostShower">
            <i class="menuIcon fa-solid fa-arrow-right"></i>Posts
        </div>
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>`);
        ShowConnection();
    });
    //#endregion
}

function attach_Posts_UI_Events_Callback() {

    linefeeds_to_Html_br(".postText");
    // attach icon command click event callback
    $(".editCmd").off();
    $(".editCmd").on("click", function () {
        showEditPostForm($(this).attr("postId"));
    });
    $(".deleteCmd").off();
    $(".deleteCmd").on("click", function () {
        showDeletePostForm($(this).attr("postId"));
    });
    $(".moreText").off();
    $(".moreText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).show();
        $(`.lessText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('showExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('hideExtra');
    })
    $(".lessText").off();
    $(".lessText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).hide();
        $(`.moreText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        postsPanel.scrollToElem($(this).attr("postId"));
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('hideExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('showExtra');
    })
}
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        postsPanel.itemsPanel.append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

/////////////////////// Posts content manipulation ///////////////////////////////////////////////////////

function linefeeds_to_Html_br(selector) {
    $.each($(selector), function () {
        let postText = $(this);
        var str = postText.html();
        var regex = /[\r\n]/g;
        postText.html(str.replace(regex, "<br>"));
    })
}
function highlight(text, elem) {
    text = text.trim();
    if (text.length >= minKeywordLenth) {
        var innerHTML = elem.innerHTML;
        let startIndex = 0;

        while (startIndex < innerHTML.length) {
            var normalizedHtml = innerHTML.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            var index = normalizedHtml.indexOf(text, startIndex);
            let highLightedText = "";
            if (index >= startIndex) {
                highLightedText = "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>";
                innerHTML = innerHTML.substring(0, index) + highLightedText + innerHTML.substring(index + text.length);
                startIndex = index + highLightedText.length + 1;
            } else
                startIndex = innerHTML.length + 1;
        }
        elem.innerHTML = innerHTML;
    }
}
function highlightKeywords() {
    if (showKeywords) {
        let keywords = $("#searchKeys").val().split(' ');
        if (keywords.length > 0) {
            keywords.forEach(key => {
                let titles = document.getElementsByClassName('postTitle');
                Array.from(titles).forEach(title => {
                    highlight(key, title);
                })
                let texts = document.getElementsByClassName('postText');
                Array.from(texts).forEach(text => {
                    highlight(key, text);
                })
            })
        }
    }
}

//////////////////////// Forms rendering /////////////////////////////////////////////////////////////////

async function renderEditPostForm(id) {
    $('#commit').show();
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        if (Post !== null)
            renderPostForm(Post);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let post = response.data;
        if (post !== null) {
            let date = convertToFrenchDate(UTC_To_Local(post.Date));
            $("#form").append(`
                <div class="post" id="${post.Id}">
                <div class="postHeader">  ${post.Category} </div>
                <div class="postTitle ellipsis"> ${post.Title} </div>
                <img class="postImage" src='${post.Image}'/>
                <div class="postDate"> ${date} </div>
                <div class="postTextContainer showExtra">
                    <div class="postText">${post.Text}</div>
                </div>
            `);
            linefeeds_to_Html_br(".postText");
            // attach form buttons click event callback
            $('#commit').on("click", async function () {
                await Posts_API.Delete(post.Id);
                if (!Posts_API.error) {
                    await showPosts();
                }
                else {
                    console.log(Posts_API.currentHttpError)
                    showError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", async function () {
                await showPosts();
            });

        } else {
            showError("Post introuvable!");
        }
    } else
        showError(Posts_API.currentHttpError);
}
function newPost() {
    let Post = {};
    Post.Id = 0;
    Post.Title = "";
    Post.Text = "";
    Post.Image = "news-logo-upload.png";
    Post.Category = "";
    return Post;
}
function newUser() {
    let User = {};
    User.Id = 0;
    User.Name = "";
    User.Email = "";
    User.Password = "";
    User.Avatar = "no-avatar.png"
    return User;
}
function renderPostForm(post = null) {
    let create = post == null;
    if (create) post = newPost();
    $("#form").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
             <input type="hidden" name="Date" value="${post.Date}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${post.Title}"
            />
            <label for="Url" class="form-label">Texte</label>
             <textarea class="form-control" 
                          name="Text" 
                          id="Text"
                          placeholder="Texte" 
                          rows="9"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'>${post.Text}</textarea>

            <label class="form-label">Image </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                     newImage='${create}' 
                     controlId='Image' 
                     imageSrc='${post.Image}' 
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <div id="keepDateControl">
                <input type="checkbox" name="keepDate" id="keepDate" class="checkbox" checked>
                <label for="keepDate"> Conserver la date de création </label>
            </div>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary displayNone">
        </form>
    `);
    if (create) $("#keepDateControl").hide();

    initImageUploaders();
    initFormValidation(); // important do to after all html injection!

    $("#commit").click(function () {
        $("#commit").off();
        return $('#savePost').trigger("click");
    });
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        if (post.Category != selectedCategory)
            selectedCategory = "";
        if (create || !('keepDate' in post))
            post.Date = Local_to_UTC(Date.now());
        delete post.keepDate;
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            await showPosts();
            postsPanel.scrollToElem(post.Id);
        }
        else
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
}
function getFormData($form) {
    // prevent html injections
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    // grab data from all controls
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderUserForm(User = null) {
    $("#ConnectContainer").hide();
    $("#commit").hide();
    let create = User == null;
    let BtnSupprimer = "";
    if (create)
        User = newUser();
    else
        BtnSupprimer = `<Button id="SupBtn">Supprimer Profil</Button>`;
    
    $("#form").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${User.Id}" id="Id"/>
            <h1 id="ConflictText"></h1>
            <label for="Email" class="form-label">Adresse de couriel </label>
            <input class="form-control" name="Email" id="Email" placeholder="Courriel" required value="${User.Email}"/>
            <br>
            <input class="form-control placeholder="Vérification" required value="${User.Email}"/>

            <label for="Password" class="form-label">Mot de passe</label>
            <input type="password" class="form-control" name="Password" id="Password" placeholder="Mot de passe" required/>
            <br>
            <input type="password" class="form-control" placeholder="Vérification" required/>

            <label for="Name" class="form-label">Nom </label>
            <input class="form-control" name="Name" id="Name" placeholder="Nom" required RequireMessage="Veuillez entrer un nom" InvalidMessage="Le nom comporte un caractère illégal" value="${User.Name}"/>

            <label class="form-label">Avatar </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                     newImage='${User.Avatar}'
                     controlId='Avatar' 
                     imageSrc='${User.Avatar}' 
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <br>
            <input type="submit" value="Enregistrer" id="saveUser" class="btn btn-primary">
        </form>
        ${BtnSupprimer}
    `);
    if (create) addConflictValidation("/accounts/conflict", "Email", "saveUser")
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!

    $("#commit").click(function () {
        $("#commit").off();
        return $('#savePost').trigger("click");
    });
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        post = await User_API.API_SaveUser(post, create);
        ShowConnection("Votre compte a été créé. Veuillez prendre votre courriels pour récupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion");
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
    $("#SupBtn").click(function (){
        showSup();
    });
}
