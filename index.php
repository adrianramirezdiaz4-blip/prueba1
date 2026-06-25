<?php
$imagenes = [];
$dir = __DIR__ . "/photos";
if (is_dir($dir)) {
    foreach (scandir($dir) as $f) {
        if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $f)) {
            $imagenes[] = "photos/" . $f;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Galería Privada</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>Galería Privada</h1>
<p>Las imágenes colocadas en la carpeta <b>photos</b> aparecerán automáticamente.</p>

<div class="gallery">
<?php foreach($imagenes as $img): ?>
<a href="<?= htmlspecialchars($img) ?>" target="_blank">
    <img src="<?= htmlspecialchars($img) ?>" alt="foto">
</a>
<?php endforeach; ?>
</div>
</body>
</html>