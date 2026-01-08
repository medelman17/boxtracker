import React, { createContext, useContext } from "react";
import { View, useColorScheme } from "react-native";
import { OverlayProvider } from "@gluestack-ui/overlay";
import { config } from "./config";

type ColorMode = "light" | "dark" | "system";

type GluestackUIContextType = {
  colorMode: "light" | "dark";
};

const GluestackUIContext = createContext<GluestackUIContextType>({
  colorMode: "light",
});

export const useGluestackUI = () => useContext(GluestackUIContext);

type GluestackUIProviderProps = {
  mode?: ColorMode;
  children: React.ReactNode;
};

export function GluestackUIProvider({
  mode = "light",
  children,
}: GluestackUIProviderProps) {
  const systemColorScheme = useColorScheme();

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemColorScheme ?? "light") : mode;

  const colorSchemeStyle = config[resolvedMode];

  return (
    <GluestackUIContext.Provider value={{ colorMode: resolvedMode }}>
      <OverlayProvider>
        <View style={[{ flex: 1 }, colorSchemeStyle]} className={resolvedMode}>
          {children}
        </View>
      </OverlayProvider>
    </GluestackUIContext.Provider>
  );
}
