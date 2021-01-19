export module STL{
    
function LoadSTL () {
    var binaryVector3 = function (view, offset) {
        var v = new THREE.Vector3();
        v.x = view.getFloat32(offset + 0, true);
        v.y = view.getFloat32(offset + 4, true);
        v.z = view.getFloat32(offset + 8, true);
        return v;
    }

    var loadBinaryStl = function (text, size) {
        // binary STL
        /* ���������, ������������ ��� ������ � ������ �������� �������� */
        var view = new DataView(text);
        /* ���������� �� 80 ���� � ��������� 32-��������� ����� ����� ��� ����� - ����� ������������� */
        size = view.getUint32(80, true);
        /* �������� ��������������� ������� */
        var geom = new THREE.Geometry();
        /* ������� header � ����� ������������� */
        var offset = 84;
        for (var i = 0; i < size; i++) {
            var normal = binaryVector3(view, offset);
            geom.vertices.push(binaryVector3(view, offset + 12));
            geom.vertices.push(binaryVector3(view, offset + 24));
            geom.vertices.push(binaryVector3(view, offset + 36));
            geom.faces.push(
                new THREE.Face3(i * 3, i * 3 + 1, i * 3 + 2, normal));
            offset += 4 * 3 * 4 + 2;
        }
        return geom;
    };

    return function (text, size) {
        return loadBinaryStl(text, size);
    };
})();
}