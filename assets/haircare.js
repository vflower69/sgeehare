// SUGi Hair, hair care page

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
    var ERROR_MS = 10000;   // how long each red error message stays
    var errorTimers = {};
    var REQUIRED = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "subject", label: "Subject" },
        { key: "body", label: "Body" }
    ];
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

    // Required fields: Name, Email, Subject and Body must not be empty.
    // An empty one gets a red message under it for 10 seconds, and nothing is sent.
    function clearError(key) {
        clearTimeout(errorTimers[key]);
        document.getElementById("contact-" + key + "-error").textContent = "";
        form.elements[key].removeAttribute("aria-invalid");
    }

    function clearErrors() {
        REQUIRED.forEach(function (f) { clearError(f.key); });
    }

    function showError(key, text) {
        clearError(key);
        document.getElementById("contact-" + key + "-error").textContent = text;
        form.elements[key].setAttribute("aria-invalid", "true");
        errorTimers[key] = setTimeout(function () { clearError(key); }, ERROR_MS);
    }

    function validate() {
        var first = null;
        clearErrors();
        REQUIRED.forEach(function (f) {
            if (field(f.key) === "") {
                showError(f.key, f.label + " cannot be empty");
                first = first || f.key;
            } else if (f.key === "email" && !form.elements.email.checkValidity()) {
                showError("email", "Enter a valid email address");
                first = first || f.key;
            }
        });
        if (first) form.elements[first].focus();
        return !first;
    }

    // Typing in a field with an error clears that error straight away.
    REQUIRED.forEach(function (f) {
        form.elements[f.key].addEventListener("input", function () { clearError(f.key); });
    });

    function open(event) {
        event.preventDefault();
        say("");
        hideSuccess();
        clearErrors();
        dialog.showModal();
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    for (var i = 0; i < openers.length; i++) {
        openers[i].addEventListener("click", open);
    }

    dialog.addEventListener("close", function () {
        hideSuccess();
        clearErrors();
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

        hideSuccess();

        if (!validate()) return;

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
