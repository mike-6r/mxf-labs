import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

public final class LicenseClient {
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();
    private final Gson gson = new Gson();
    private final String apiBaseUrl;
    private final String licenseKey;
    private final String productSlug;
    private final String productVersion;
    private final String deviceId;
    private final String instanceId;

    public LicenseClient(
            String apiBaseUrl,
            String licenseKey,
            String productSlug,
            String productVersion,
            String deviceId,
            String instanceId
    ) {
        this.apiBaseUrl = apiBaseUrl.replaceAll("/+$", "");
        this.licenseKey = licenseKey;
        this.productSlug = productSlug;
        this.productVersion = productVersion;
        this.deviceId = deviceId;
        this.instanceId = instanceId;
    }

    public LicenseResult activate() throws IOException, InterruptedException {
        JsonObject json = request("/api/v1/licenses/activate");
        return LicenseResult.from(json, json.has("activated") && json.get("activated").getAsBoolean());
    }

    public LicenseResult validate() throws IOException, InterruptedException {
        JsonObject json = request("/api/v1/licenses/validate");
        return LicenseResult.from(json, json.has("valid") && json.get("valid").getAsBoolean());
    }

    public LicenseResult heartbeat() throws IOException, InterruptedException {
        JsonObject json = request("/api/v1/licenses/heartbeat");
        return LicenseResult.from(json, json.has("alive") && json.get("alive").getAsBoolean());
    }

    private JsonObject request(String path) throws IOException, InterruptedException {
        String body = gson.toJson(Map.of(
                "key", licenseKey,
                "productSlug", productSlug,
                "productVersion", productVersion,
                "deviceId", deviceId,
                "instanceId", instanceId
        ));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + path))
                .timeout(Duration.ofSeconds(12))
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        JsonObject json = gson.fromJson(response.body(), JsonObject.class);

        if (response.statusCode() >= 400 || json == null || !json.get("ok").getAsBoolean()) {
            String message = json != null && json.has("message") ? json.get("message").getAsString() : response.body();
            throw new IOException("MxF license API failed: HTTP " + response.statusCode() + " / " + message);
        }

        return json;
    }

    public record LicenseResult(
            boolean allowed,
            String code,
            String reason,
            String message,
            String leaseToken,
            String leaseExpiresAt,
            int heartbeatSeconds,
            int offlineGraceSeconds
    ) {
        static LicenseResult from(JsonObject json, boolean allowed) {
            JsonObject lease = json.has("lease") && json.get("lease").isJsonObject()
                    ? json.getAsJsonObject("lease")
                    : new JsonObject();
            JsonObject policy = json.has("policy") && json.get("policy").isJsonObject()
                    ? json.getAsJsonObject("policy")
                    : new JsonObject();

            return new LicenseResult(
                    allowed,
                    json.has("code") ? json.get("code").getAsString() : "UNKNOWN",
                    json.has("reason") ? json.get("reason").getAsString() : "unknown",
                    json.has("message") ? json.get("message").getAsString() : "License check completed.",
                    lease.has("token") ? lease.get("token").getAsString() : null,
                    lease.has("expiresAt") ? lease.get("expiresAt").getAsString() : null,
                    policy.has("heartbeatSeconds") ? policy.get("heartbeatSeconds").getAsInt() : 300,
                    lease.has("offlineGraceSeconds") ? lease.get("offlineGraceSeconds").getAsInt() : 21600
            );
        }
    }
}
