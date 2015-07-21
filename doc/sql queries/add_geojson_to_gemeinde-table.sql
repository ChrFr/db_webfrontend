UPDATE vg250_krs
--projection of input file
SET geom = st_setsrid(geom, 25832);

--SELECT st_srid(geom)

--transform to WGS 84 as d3 needs it as input
SELECT rs, gen as name, ST_AsGeoJSON(st_transform(geom, 4326)) as geom_json
FROM vg250_gem;