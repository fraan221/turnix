self.addEventListener("push", (event) => {
  const data = JSON.parse(event.data.text());

  const title = data.title || "Turnix";
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-monochrome.png",
    data: {
      url: data.url || "/dashboard/notifications",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const baseUrl = event.notification.data.url;
  const urlToOpen = new URL(baseUrl, self.location.origin);
  urlToOpen.searchParams.append("source", "notification");

  const promise = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].visibilityState === "visible") {
            client = clientList[i];
            break;
          }
        }
        if (client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }

      return clients.openWindow(urlToOpen);
    });

  event.waitUntil(promise);
});