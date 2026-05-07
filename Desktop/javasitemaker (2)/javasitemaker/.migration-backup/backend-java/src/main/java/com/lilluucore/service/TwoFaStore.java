package com.lilluucore.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwoFaStore {

    private record Entry(String code, long expires) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public String generateAndStore(String userId) {
        String code = String.format("%06d", (int)(Math.random() * 900000) + 100000);
        store.put(userId, new Entry(code, System.currentTimeMillis() + 5 * 60 * 1000));
        return code;
    }

    public boolean verify(String userId, String code) {
        Entry entry = store.get(userId);
        if (entry == null) return false;
        if (System.currentTimeMillis() > entry.expires()) return false;
        if (!entry.code().equals(code)) return false;
        store.remove(userId);
        return true;
    }
}
