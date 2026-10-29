/**
 * Bogotá Major Arterial Avenue Network (Red Vial Principal)
 * High-precision GeoJSON LineStrings for Bogotá's iconic avenues
 * Rendered in glowing amber (#df8b35) over the dark charcoal basemap
 */

export const AVENIDAS_BOGOTA_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    // 1. Autopista Norte / Carrera 45 (Calle 80 -> Calle 220)
    {
      type: "Feature" as const,
      properties: { name: "Autopista Norte", type: "autopista" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0628, 4.6675],
          [-74.0583, 4.6853],
          [-74.0538, 4.7088],
          [-74.0489, 4.7335],
          [-74.0435, 4.7578],
          [-74.0378, 4.7818],
          [-74.0321, 4.8055],
          [-74.0256, 4.8320],
        ],
      },
    },
    // 2. Carrera 7 (Calle 1 Sur -> Calle 200)
    {
      type: "Feature" as const,
      properties: { name: "Carrera 7", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0845, 4.5888],
          [-74.0755, 4.6025],
          [-74.0688, 4.6225],
          [-74.0645, 4.6465],
          [-74.0560, 4.6750],
          [-74.0410, 4.7120],
          [-74.0280, 4.7450],
          [-74.0215, 4.7780],
          [-74.0185, 4.8150],
        ],
      },
    },
    // 3. Avenida El Dorado / Calle 26 (Carrera 3 -> Aeropuerto El Dorado)
    {
      type: "Feature" as const,
      properties: { name: "Avenida El Dorado", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0675, 4.6152],
          [-74.0785, 4.6238],
          [-74.0925, 4.6335],
          [-74.1085, 4.6495],
          [-74.1230, 4.6655],
          [-74.1375, 4.6820],
          [-74.1480, 4.6945],
        ],
      },
    },
    // 4. Avenida Boyacá (Calle 170 -> Autopista Sur / Yomasa)
    {
      type: "Feature" as const,
      properties: { name: "Avenida Boyacá", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0585, 4.7620],
          [-74.0695, 4.7310],
          [-74.0815, 4.7010],
          [-74.0955, 4.6720],
          [-74.1120, 4.6480],
          [-74.1350, 4.6250],
          [-74.1520, 4.5980],
          [-74.1480, 4.5650],
          [-74.1320, 4.5350],
          [-74.1180, 4.5080],
        ],
      },
    },
    // 5. Avenida Carrera 68 (Autonorte -> Autopista Sur)
    {
      type: "Feature" as const,
      properties: { name: "Avenida 68", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0620, 4.6880],
          [-74.0750, 4.6750],
          [-74.0920, 4.6620],
          [-74.1080, 4.6450],
          [-74.1220, 4.6280],
          [-74.1380, 4.6050],
          [-74.1550, 4.5820],
        ],
      },
    },
    // 6. Avenida NQS / Carrera 30 / Autopista Sur (Calle 92 -> Bosa / Soacha)
    {
      type: "Feature" as const,
      properties: { name: "Av NQS / Autopista Sur", type: "autopista" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0590, 4.6800],
          [-74.0680, 4.6540],
          [-74.0780, 4.6320],
          [-74.0920, 4.6120],
          [-74.1120, 4.5920],
          [-74.1360, 4.5800],
          [-74.1680, 4.5850],
          [-74.1920, 4.5820],
        ],
      },
    },
    // 7. Avenida Calle 80 (Autonorte / Los Héroes -> Río Bogotá / Puente de Guadua)
    {
      type: "Feature" as const,
      properties: { name: "Calle 80", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0630, 4.6680],
          [-74.0790, 4.6790],
          [-74.0980, 4.6930],
          [-74.1180, 4.7080],
          [-74.1380, 4.7210],
          [-74.1620, 4.7330],
        ],
      },
    },
    // 8. Avenida Las Américas (Carrera 30 -> Bosa / Kennedy)
    {
      type: "Feature" as const,
      properties: { name: "Avenida de las Américas", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0880, 4.6220],
          [-74.1080, 4.6240],
          [-74.1310, 4.6250],
          [-74.1550, 4.6270],
          [-74.1750, 4.6220],
        ],
      },
    },
    // 9. Avenida Ciudad de Cali (Suba -> Bosa)
    {
      type: "Feature" as const,
      properties: { name: "Avenida Ciudad de Cali", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0950, 4.7550],
          [-74.1080, 4.7280],
          [-74.1210, 4.6980],
          [-74.1380, 4.6680],
          [-74.1580, 4.6380],
          [-74.1780, 4.6150],
          [-74.1950, 4.5920],
        ],
      },
    },
    // 10. Avenida Primero de Mayo (Carrera 10 -> Bosa)
    {
      type: "Feature" as const,
      properties: { name: "Avenida Primero de Mayo", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0920, 4.5750],
          [-74.1180, 4.5880],
          [-74.1450, 4.6020],
          [-74.1720, 4.6150],
          [-74.1950, 4.6220],
        ],
      },
    },
    // 11. Avenida Suba (Calle 100 -> Suba Centro)
    {
      type: "Feature" as const,
      properties: { name: "Avenida Suba", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0680, 4.6860],
          [-74.0780, 4.7050],
          [-74.0890, 4.7250],
          [-74.0960, 4.7450],
        ],
      },
    },
    // 12. Avenida Calle 13 / Centenario (NQS -> Río Bogotá)
    {
      type: "Feature" as const,
      properties: { name: "Avenida Calle 13", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0820, 4.6090],
          [-74.1050, 4.6280],
          [-74.1290, 4.6460],
          [-74.1550, 4.6650],
        ],
      },
    },
    // 13. Avenida Caracas (Calle 80 -> Usme)
    {
      type: "Feature" as const,
      properties: { name: "Avenida Caracas", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0640, 4.6650],
          [-74.0720, 4.6350],
          [-74.0810, 4.6050],
          [-74.0980, 4.5750],
          [-74.1150, 4.5350],
          [-74.1280, 4.4950],
        ],
      },
    },
    // 14. Calle 100 / Avenida España
    {
      type: "Feature" as const,
      properties: { name: "Calle 100", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0380, 4.6850],
          [-74.0510, 4.6840],
          [-74.0620, 4.6880],
          [-74.0750, 4.6920],
        ],
      },
    },
    // 15. Calle 127 / Avenida Rodrigo Lara Bonilla
    {
      type: "Feature" as const,
      properties: { name: "Calle 127", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0290, 4.7080],
          [-74.0450, 4.7080],
          [-74.0580, 4.7090],
          [-74.0750, 4.7150],
        ],
      },
    },
    // 16. Calle 170 / Avenida San José
    {
      type: "Feature" as const,
      properties: { name: "Calle 170", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0210, 4.7560],
          [-74.0420, 4.7560],
          [-74.0620, 4.7570],
          [-74.0880, 4.7580],
        ],
      },
    },
    // 17. Calle 53
    {
      type: "Feature" as const,
      properties: { name: "Calle 53", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0650, 4.6440],
          [-74.0780, 4.6460],
          [-74.0950, 4.6520],
          [-74.1120, 4.6590],
        ],
      },
    },
    // 18. Calle 63 / Av. José Celestino Mutis
    {
      type: "Feature" as const,
      properties: { name: "Calle 63", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0620, 4.6540],
          [-74.0760, 4.6580],
          [-74.0980, 4.6640],
          [-74.1200, 4.6720],
          [-74.1400, 4.6850],
        ],
      },
    },
    // 19. Avenida de la Esperanza
    {
      type: "Feature" as const,
      properties: { name: "Avenida La Esperanza", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0880, 4.6290],
          [-74.1080, 4.6420],
          [-74.1280, 4.6560],
          [-74.1480, 4.6710],
        ],
      },
    },
    // 20. Avenida Villavicencio
    {
      type: "Feature" as const,
      properties: { name: "Avenida Villavicencio", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.1750, 4.6150],
          [-74.1550, 4.5880],
          [-74.1400, 4.5720],
          [-74.1150, 4.5500],
        ],
      },
    },
    // 21. Avenida Circunvalar
    {
      type: "Feature" as const,
      properties: { name: "Avenida Circunvalar", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0810, 4.5850],
          [-74.0710, 4.6010],
          [-74.0620, 4.6250],
          [-74.0550, 4.6550],
          [-74.0480, 4.6780],
        ],
      },
    },
    // 22. Carrera 9 / 11
    {
      type: "Feature" as const,
      properties: { name: "Carrera 9 / 11", type: "arterial" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-74.0560, 4.6550],
          [-74.0510, 4.6750],
          [-74.0450, 4.6980],
          [-74.0380, 4.7200],
          [-74.0310, 4.7450],
        ],
      },
    },
  ],
};
