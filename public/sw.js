self.addEventListener(
    "install",
    event => {

        self.skipWaiting();

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            clients.claim()
        );

    }
);


self.addEventListener(
    "push",
    event => {

        let data = {

            title:
                "💊 Medication Reminder",

            body:
                "It is time to take your medication.",

            url:
                "/reminder.html"

        };


        if (event.data) {

            try {

                data =
                    event.data.json();

            }

            catch (error) {

                data.body =
                    event.data.text();

            }

        }


        event.waitUntil(

            self.registration.showNotification(

                data.title ||
                "💊 Medication Reminder",

                {

                    body:
                        data.body ||
                        "It is time for your medication.",

                    tag:
                        data.tag ||
                        "medication-reminder",

                    requireInteraction:
                        true,

                    data: {

                        url:
                            data.url ||
                            "/reminder.html"

                    }

                }

            )

        );

    }
);


self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const url =
            event.notification.data &&
            event.notification.data.url
                ? event.notification.data.url
                : "/reminder.html";


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

            .then(
                clientList => {

                    for (
                        const client
                        of clientList
                    ) {

                        if (
                            "focus" in client
                        ) {

                            return client.focus();

                        }

                    }


                    if (
                        clients.openWindow
                    ) {

                        return clients.openWindow(
                            url
                        );

                    }

                }
            )

        );

    }
);