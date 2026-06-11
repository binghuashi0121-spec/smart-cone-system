idf_component_register(SRCS "example_ble_client_throughput.c"
PRIV_REQUIRES bt nvs_flash esp_driver_uart esp_driver_gpio esp_timer
                    INCLUDE_DIRS ".")
