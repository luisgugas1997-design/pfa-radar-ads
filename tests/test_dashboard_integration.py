from pathlib import Path

from backend.main import app


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def test_dashboard_contains_native_radar_screen() -> None:
    html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")

    assert 'data-screen="radar"' in html
    assert 'id="screen-radar"' in html
    assert 'src="modules/radar.js"' in html
    assert "iframe" not in html[html.index('id="screen-radar"') :]


def test_radar_module_requires_confirmation_before_paid_scan() -> None:
    javascript = (PROJECT_ROOT / "modules" / "radar.js").read_text(
        encoding="utf-8"
    )

    assert "radar-confirm-scan" in javascript
    assert "previewPlan" in javascript
    assert "executePlan" in javascript
    assert "fetchJson('/api/radar/scan'" in javascript


def test_fastapi_exposes_protected_dashboard_assets() -> None:
    route_paths = {
        route.path for route in app.routes if getattr(route, "path", None)
    }

    assert "/dashboard" in route_paths
    assert "/modules/{file_name}" in route_paths
    assert "/api/radar/dashboard" in route_paths

