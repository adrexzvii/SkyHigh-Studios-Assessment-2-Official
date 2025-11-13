#pragma once

// Declaración (ya no será static)
void OnMessageFromJS(const char* buf, unsigned int bufSize, void* ctx);
// Inicializa el Communication Bus de MSFS (CommBus API)
void CommBus_Initialize();

// Limpia / finaliza el Communication Bus
void CommBus_Shutdown();