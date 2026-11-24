// =====================================================
// PATIENT REGISTRATION
// =====================================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // Generate Hospital Unique ID

            const patientId =
                generatePatientId();


            // Collect patient information

            const patient = {

                patientId:
                    patientId,

                name:
                    document.getElementById("name").value,

                dob:
                    document.getElementById("dob").value,

                gender:
                    document.getElementById("gender").value,

                bloodGroup:
                    document.getElementById("bloodGroup").value,

                phone:
                    document.getElementById("phone").value,

                email:
                    document.getElementById("email").value,

                address:
                    document.getElementById("address").value,

                diabetesType:
                    document.getElementById(
                        "diabetesType"
                    ).value,

                emergencyContact:
                    document.getElementById(
                        "emergencyContact"
                    ).value,

                password:
                    document.getElementById(
                        "registerPassword"
                    ).value

            };


            // Save patient

            localStorage.setItem(

                "patient_" + patientId,

                JSON.stringify(patient)

            );


            // Show Unique ID

            const message =
                document.getElementById(
                    "registerMessage"
                );


            message.style.color = "#08758e";


            message.innerHTML =

                "Registration successful!<br>" +

                "Your Hospital Unique ID is:<br>" +

                "<strong style='font-size:20px'>" +

                patientId +

                "</strong><br>" +

                "Please remember this ID for login.";


            // Clear form

            registerForm.reset();


            // Redirect to login

            setTimeout(function() {

                window.location.href =
                    "index.html";

            }, 5000);

        }
    );

}



// =====================================================
// GENERATE PATIENT ID
// =====================================================

function generatePatientId() {

    let number =
        localStorage.getItem(
            "patientNumber"
        );


    if (!number) {

        number = 1;

    }
    else {

        number =
            parseInt(number) + 1;

    }


    localStorage.setItem(
        "patientNumber",
        number
    );


    const year =
        new Date().getFullYear();


    const formattedNumber =
        String(number).padStart(4, "0");


    return "PAT" +
           year +
           formattedNumber;

}



// =====================================================
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const patientId =

                document.getElementById(
                    "loginId"
                )
                .value
                .trim()
                .toUpperCase();


            const password =

                document.getElementById(
                    "loginPassword"
                )
                .value;


            const message =

                document.getElementById(
                    "loginMessage"
                );


            // Find patient

            const patientData =

                localStorage.getItem(
                    "patient_" + patientId
                );


            if (!patientData) {

                message.style.color = "red";

                message.innerText =
                    "Invalid Hospital Unique ID.";

                return;

            }


            const patient =
                JSON.parse(patientData);


            // Check password

            if (
                patient.password !== password
            ) {

                message.style.color = "red";

                message.innerText =
                    "Incorrect password.";

                return;

            }


            // Save login

            localStorage.setItem(
                "loggedInPatient",
                patientId
            );


            message.style.color = "green";

            message.innerText =
                "Login successful!";


            setTimeout(function() {

                window.location.href =
                    "profile.html";

            }, 800);

        }
    );

}



// =====================================================
// LOAD PROFILE
// =====================================================

if (
    window.location.pathname
        .toLowerCase()
        .includes("profile.html")
) {


    const loggedInId =

        localStorage.getItem(
            "loggedInPatient"
        );


    if (!loggedInId) {

        window.location.href =
            "index.html";

    }
    else {


        const patientData =

            localStorage.getItem(
                "patient_" + loggedInId
            );


        if (!patientData) {

            window.location.href =
                "index.html";

        }
        else {


            const patient =
                JSON.parse(patientData);


            document.getElementById(
                "profileId"
            ).innerText =
                patient.patientId;


            document.getElementById(
                "profileName"
            ).innerText =
                patient.name;


            document.getElementById(
                "profileDob"
            ).innerText =
                patient.dob;


            document.getElementById(
                "profileGender"
            ).innerText =
                patient.gender;


            document.getElementById(
                "profileBlood"
            ).innerText =
                patient.bloodGroup;


            document.getElementById(
                "profilePhone"
            ).innerText =
                patient.phone;


            document.getElementById(
                "profileEmail"
            ).innerText =
                patient.email;


            document.getElementById(
                "profileAddress"
            ).innerText =
                patient.address;


            document.getElementById(
                "profileDiabetes"
            ).innerText =
                patient.diabetesType;


            document.getElementById(
                "profileEmergency"
            ).innerText =
                patient.emergencyContact;

        }

    }

}



// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "loggedInPatient"
    );


    window.location.href =
        "index.html";

}
<script>

document
.getElementById("loginForm")
.addEventListener("submit", function(event) {

    event.preventDefault();


    // Get Hospital Unique ID

    const patientId =
        document
        .getElementById("loginId")
        .value
        .trim()
        .toUpperCase();


    // Get Password

    const password =
        document
        .getElementById("loginPassword")
        .value;


    // Message area

    const message =
        document
        .getElementById("loginMessage");


    // Find registered patient

    const patientData =
        localStorage.getItem(
            "patient_" + patientId
        );


    // Check ID

    if (!patientData) {

        message.style.color = "red";

        message.innerText =
            "Invalid Hospital Unique ID.";

        return;

    }


    // Convert stored data

    const patient =
        JSON.parse(patientData);


    // Check password

    if (patient.password !== password) {

        message.style.color = "red";

        message.innerText =
            "Incorrect password.";

        return;

    }


    // Login successful

    localStorage.setItem(
        "loggedInPatient",
        patientId
    );


    message.style.color = "green";

    message.innerText =
        "Login successful! Opening Nurse Dosage Entry...";


    // Open Nurse Module

    setTimeout(function() {

        window.location.href =
            "nurse.html";

    }, 1000);


});

</script>