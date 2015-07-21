SELECT topology.CreateTopology('topo_kreise', 25832);
-- create a new table
CREATE TABLE kreise_topo(gid serial primary key, rs character varying(12));
--add a topogeometry column to it
SELECT topology.AddTopoGeometryColumn('topo_kreise', 'public', 'kreise_topo', 'topo', 'MULTIPOLYGON') As new_layer_id;

INSERT INTO kreise_topo(rs, topo)
SELECT rs, topology.toTopoGeom(geom, 'topo_kreise', 1)
FROM vg250_krs;


CREATE TEMP TABLE edgemap(arc_id serial, edge_id int unique);

-- header
SELECT '{ "type": "Topology", "transform": { "scale": [1,1], "translate": [0,0] }, "objects": {';
-- objects
SELECT AsTopoJSON(topo, 'edgemap') FROM kreise_topo t LIMIT 10;

-- arcs
SELECT '}, "arcs": ['
  UNION ALL
SELECT (regexp_matches(ST_AsGEOJSON(ST_SnapToGrid(e.geom,1)), '\[.*\]'))[1] as t
FROM edgemap m, topo_kreise.edge e WHERE e.edge_id = m.edge_id;

-- footer
SELECT ']}'::text as t