// SUGi Hair, Famous Tea Collection page

// Keep the footer year current.
(function () {
    var year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }
})();

// Contact pop-up.
//
// The header's Contact link opens the form in a dialog. Esc, the Close
// button, or a click outside the form closes it.
//
// To receive messages in a service, paste its URL into the form's
// data-endpoint attribute in index.html. Until then, Submit opens the
// visitor's email app with the message addressed to data-mailto.
(function () {
    var dialog = document.getElementById("contact-dialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
 
    var form = dialog.querySelector(".contact-form");
    var status = dialog.querySelector(".contact-status");
    var submit = dialog.querySelector(".submit-button");
    var success = dialog.querySelector(".contact-success");
    var successTimer;
    var SUCCESS_MS = 10000; // how long the green message stays
    var openers = document.querySelectorAll("[data-open-contact]");
 
    function say(message) {
        status.textContent = message;
    }
 
    function hideSuccess() {
        clearTimeout(successTimer);
        success.textContent = "";
    }
 
    function showSuccess() {
        hideSuccess();
        success.textContent = "Submission Success";
        successTimer = setTimeout(hideSuccess, SUCCESS_MS);
    }
 
    function open(event) {
        event.preventDefault();
        say("");
        hideSuccess();
        dialog.showModal();
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }
 
    for (var i = 0; i < openers.length; i++) {
        openers[i].addEventListener("click", open);
    }
 
    dialog.addEventListener("close", function () {
        hideSuccess();
        document.body.classList.remove("modal-open");
    });
 
    dialog.querySelector("[data-close-contact]").addEventListener("click", function () {
        dialog.close();
    });
 
    // A click on the dimmed backdrop lands on the dialog element itself.
    dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog.close();
    });
 
    function field(name) {
        return form.elements[name].value.trim();
    }
 
    function fail() {
        say("That didn't go through. Please try again, or email us directly.");
    }
 
    form.addEventListener("submit", function (event) {
        event.preventDefault();
 
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
 
        hideSuccess();
 
        var message = {
            name: field("name"),
            email: field("email"),
            collection: field("collection"),
            product: field("product"),
            subject: field("subject"),
            body: field("body")
        };
 
        var endpoint = form.getAttribute("data-endpoint");
 
        if (endpoint) {
            submit.disabled = true;
            say("Sending…");
 
            fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(message)
            })
                .then(function (response) {
                    if (!response.ok) throw new Error("Request failed");
                    form.reset();
                    say("");
                    showSuccess();
                })
                .catch(fail)
                .then(function () {
                    submit.disabled = false;
                });
            return;
        }
 
        // No service connected yet: hand the message to the visitor's email app.
        var address = form.getAttribute("data-mailto");
        var lines = [
            "Name: " + message.name,
            "Email: " + message.email
        ];
        if (message.collection) lines.push("Collection: " + message.collection);
        if (message.product) lines.push("Product: " + message.product);
        lines.push("", message.body);
 
        window.location.href = "mailto:" + address +
            "?subject=" + encodeURIComponent(message.subject) +
            "&body=" + encodeURIComponent(lines.join("\n"));
 
        say("Your email app should open with your message ready to send. If it doesn't, write to " + address + ".");
    });
})();
